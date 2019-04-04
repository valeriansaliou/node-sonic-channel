/*
 * node-sonic-channel
 *
 * Copyright 2019, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var SonicChannelSearch = require("../").Search;


var sonicChannelSearch = new SonicChannelSearch({
  host : "::1",
  port : 1491,
  auth : "SecretPassword"
}).connect({
  connected : function() {
    // Success handler
    console.info("Sonic Channel succeeded to connect to socket (search).");
    console.info("Running example...");

    setTimeout(function() {
      // Test query
      sonicChannelSearch.query(
        "messages", "default", "valerian saliou",

        {
          limit  : 20,
          offset : 0
        }
      )
        .then(function(data) {
          console.info("Query #1 succeeded", data);
        })
        .catch(function(error) {
          console.error("Query #1 failed", error);
        });

      console.info("Sent: query");

      // Test suggest
      sonicChannelSearch.suggest(
        "messages", "default", "valerian"
      )
        .then(function(data) {
          console.info("Suggest #1 succeeded", data);
        })
        .catch(function(error) {
          console.error("Suggest #1 failed", error);
        });

      console.info("Sent: suggest");

      console.info("Hold on...");

      setTimeout(function() {
        // Test close (#1)
        sonicChannelSearch.close()
          .then(function(data) {
            console.info("Close #1 succeeded", data);
          })
          .catch(function(error) {
            console.error("Close #1 failed", error);
          });

        console.info("Sent: close#1");

        // Test close (#2)
        sonicChannelSearch.close()
          .then(function(data) {
            console.info("Close #2 succeeded", data);
          })
          .catch(function(error) {
            console.error("Close #2 failed", error);
          });

        console.info("Sent: close#2");

        // Test query (after close)
        sonicChannelSearch.query(
          "messages", "default", "hello"
        )
          .then(function(data) {
            console.info("Query #2 succeeded (this is not expected)", data);

            process.exit(1);
          })
          .catch(function(error) {
            console.error("Query #2 failed (this is expected)", error);

            process.exit(0);
          });

        console.info("Sent: queryAfterClose");
      }, 4000);
    }, 500);
  },

  disconnected : function() {
    // Disconnected handler
    console.error("Sonic Channel is now disconnected (search).");
    console.info("Done running example.");
  },

  timeout : function() {
    // Timeout handler
    console.error("Sonic Channel connection timed out (search).");
  },

  retrying : function() {
    // Retry handler
    console.error("Trying to reconnect to Sonic Channel (search)...");
  },

  error : function(error) {
    // Failure handler
    console.error("Sonic Channel failed to connect to socket (search).", error);
  }
});

process.stdin.resume();
