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
}).connect(
  function() {
    // Success handler
    console.info("Sonic Channel succeeded to connect to socket (search).");
    console.info("Running flow...");

    setTimeout(function() {
      // Test query
      var query = sonicChannelSearch.query(
        "messages", "default", "valerian saliou",

        function(result) {
          console.debug("Result: query", result);
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
        var close1 = sonicChannelSearch.close();

        console.info("Sent: close#1", close1);

        // Test close (#2)
        var close2 = sonicChannelSearch.close();

        console.info("Sent: close#2", close2);

        // Test query (after close)
        var queryAfterClose = sonicChannelSearch.query(
          "messages", "default", "hello"
        );

        console.info("Sent: queryAfterClose", queryAfterClose);

        console.info("Hold on...");

        setTimeout(function() {
          console.info("Reconnecting...");

          // Reconnect
          sonicChannelSearch.connect(
            function() {
              console.info("Reconnected.");

              console.info("Hold on...");

              setTimeout(function() {
                console.info("Disconnecting...");

                sonicChannelSearch.close(function() {
                  console.info("Disconnected...");
                  console.info("Done running flow.");

                  process.exit(0);
                });
              }, 1000);
            },

            function(error_reco) {
              console.error("Failed reconnecting.", error_reco);
            }
          );
        }, 1000);
      }, 4000);
    }, 500);
  },

  function(error) {
    // Failure handler
    console.error("Sonic Channel failed to connect to socket (search).", error);
  }
);

process.stdin.resume();
