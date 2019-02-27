/*
 * node-sonic-channel
 *
 * Copyright 2019, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var SonicChannelIngest = require("../").Ingest;


var sonicChannelIngest = new SonicChannelIngest({
  host : "::1",
  port : 1491,
  auth : "SecretPassword"
}).connect({
  connected : function() {
    // Success handler
    console.info("Sonic Channel succeeded to connect to socket (ingest).");
    console.info("Running example...");

    setTimeout(function() {
      // Test push
      var push = sonicChannelIngest.push(
        "messages", "default", "a6b1z", "valerian saliou",

        function(_, error) {
          if (error) {
            console.error("Push failed", error);
          } else {
            console.info("Push succeeded");
          }
        }
      );

      console.info("Sent: push", push);

      // Test count
      var count = sonicChannelIngest.count(
        "messages", "default", "a6b1z",

        function(count, error) {
          if (error) {
            console.error("Count failed", error);
          } else {
            console.info("Count succeeded", count);
          }
        }
      );

      console.info("Sent: count", count);

      console.info("Hold on...");

      setTimeout(function() {
        // Test close
        var close1 = sonicChannelIngest.close(function(data, error) {
          if (error) {
            console.error("Close failed", error);
          } else {
            console.info("Close succeeded", data);
          }
        });
      }, 4000);
    }, 500);
  },

  disconnected : function() {
    // Disconnected handler
    console.error("Sonic Channel is now disconnected (ingest).");
    console.info("Done running example.");

    process.exit(0);
  },

  timeout : function() {
    // Timeout handler
    console.error("Sonic Channel connection timed out (ingest).");
  },

  retrying : function() {
    // Retry handler
    console.error("Trying to reconnect to Sonic Channel (ingest)...");
  },

  error : function(error) {
    // Failure handler
    console.error("Sonic Channel failed to connect to socket (ingest).", error);
  }
});

process.stdin.resume();
