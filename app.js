/*
 * Name:
 * Kimsufi-checker
 *
 * Description:
 * Get a slack notification when the kimsufi server you're looking for
 * becomes available.
 *
 * Author:
 * Statox (http://github.com/statox)
 *
 * License:
 * MIT (https://github.com/statox/kimsufi-watcher/blob/master/LICENSE)
 *
 * Requirements:
 * - node-slack: this can be installed with `npm install node-slack`
 * - Get a webhook url for your slack team: https://[TEAM].slack.com/apps
 *
 * Usage:
 * - Change the variables targetReference and targetZone to set the server
 *   to watch
 * - Change the variable slackHookURL to your personnal webhook url
 * - Use cron to execute the script on a regular basis
 *
 */

var request = require('request');
var Slack = require('node-slack');

// Check the "data-ref" attribute of the <td> elements of the page
// https://www.kimsufi.com/fr/serveurs.xml
// to know the reference you're looking for.
var targetReference =  '160sk2';
var targetZone = 'westernEurope';

// KEEP IT PRIVATE
var slackHookURL = ' https://hooks.slack.com/services/XXXXXXXXX/YYYYYYYYY/ZZZZZZZZZZZZZZZZZZZZZZZZ';

// Kimsufi API URL
var url = "https://ws.ovh.com/dedicated/r2/ws.dispatcher/getAvailability2?callback=Request.JSONP.request_map.request_0";

/*
 *Get the availability for the required reference in every zones
 */
function parseResponse(targetRef, body) {
    var jsonBody = body.replace(/[^(]*\(/,'').replace(/\);$/, '');

    jsonBody = JSON.parse(jsonBody);

    var availability = {};

    jsonBody = jsonBody
        .answer.availability
        .filter(a => a.reference == targetRef)[0]
        .metaZones
        .filter(function(a) {
            availability[a.zone] = a.availability;
        });

    return availability;
}

/*
 * Send a notification to slack
 */
function sendNotification(text) {
    slack.send({
        text: text,
        channel: '@statox',
        username: 'KimsufiWatcher'
    });
}

/*
 * Check if one zone is available and send a slack notification
 */
function checkResponse(body) {
    var availability = parseResponse(targetReference, body);

    if (availability[targetZone] != 'unavailable') {
        var message = "";

        for (var zone in availability) {
            message += zone + "\t" + availability[zone] + "\n";
        }
        message += "\n";
        message += "URL Kimsufi:   ";
        message += "https://www.kimsufi.com/fr/serveurs.xml";

        sendNotification(message);
    }
}

/*
 *Make the request and the check
 */
var slack = new Slack(slackHookURL, {});
request(url, (error, response, body) => {
    checkResponse(body);
});
