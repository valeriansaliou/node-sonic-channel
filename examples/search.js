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
  port : 1491
}).connect({
  connected : function() {
    // Success handler
    console.info("Sonic Channel succeeded to connect to socket (search).");
    console.info("Running example...");

    setTimeout(function() {
      // Test query
      var query = sonicChannelSearch.query(
        "messages", "default", "valerian saliou",

        function(data, error) {
          if (error) {
            console.error("Query #1 failed", error);
          } else {
            console.info("Query #1 succeeded", data);
          }
        },

        {
          limit  : 20,
          offset : 0
        }
      );

      console.info("Sent: query", query);

      console.info("Hold on...");

      setTimeout(function() {
        // Test close (#1)
        var close1 = sonicChannelSearch.close(function(data, error) {
          if (error) {
            console.error("Close #1 failed", error);
          } else {
            console.info("Close #1 succeeded", data);
          }
        });

        console.info("Sent: close#1", close1);

        // Test close (#2)
        var close2 = sonicChannelSearch.close(function(data, error) {
          if (error) {
            console.error("Close #2 failed", error);
          } else {
            console.info("Close #2 succeeded", data);
          }
        });

        console.info("Sent: close#2", close2);

        // Test query (after close)
        var queryAfterClose = sonicChannelSearch.query(
          "messages", "default", "hello",

          function(data, error) {
            if (error) {
              console.error("Query #2 failed", error);
            } else {
              console.info("Query #2 succeeded", data);
            }
          }
        );

        console.info("Sent: queryAfterClose", queryAfterClose);
      }, 4000);
    }, 500);
  },

  disconnected : function() {
    // Disconnected handler
    console.error("Sonic Channel is now disconnected (search).");
    console.info("Done running example.");

    process.exit(0);
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
