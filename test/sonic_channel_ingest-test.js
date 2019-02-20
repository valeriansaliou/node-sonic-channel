/*
 * node-sonic-channel
 *
 * Copyright 2019, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var SonicChannelIngest = require("../").Ingest;

var assert = require("assert");


describe("node-sonic-channel", function() {
  describe("constructor", function() {
    it("should succeed creating an instance with valid options", function() {
      assert.doesNotThrow(
        function() {
          new SonicChannelIngest({
            host                : "::1",
            port                : 1491,
            offlineStackMaxSize : 0
          });
        },

        "SonicChannelIngest should not throw on valid options"
      );
    });

    it("should fail creating an instance with missing host", function() {
      assert.throws(
        function() {
          new SonicChannelIngest({
            port : 1491
          });
        },

        "SonicChannelIngest should throw on missing host"
      );
    });

    it("should fail creating an instance with missing port", function() {
      assert.throws(
        function() {
          new SonicChannelIngest({
            host : "::1"
          });
        },

        "SonicChannelIngest should throw on missing port"
      );
    });

    it("should fail creating an instance with invalid port", function() {
      assert.throws(
        function() {
          new SonicChannelIngest({
            host : "::1",
            port : -40
          });
        },

        "SonicChannelIngest should throw on invalid port"
      );
    });

    it("should fail creating an instance with invalid offlineStackMaxSize",
      function() {
        assert.throws(
          function() {
            new SonicChannelIngest({
              host                : "::1",
              port                : 1491,
              offlineStackMaxSize : "20"
            });
          },

          "SonicChannelIngest should throw on invalid offlineStackMaxSize"
        );
      }
    );
  });

  // TODO: test command methods + handlers

  describe("close method", function() {
    it("should not close twice already closed channel", function() {
      var sonicChannelIngest = new SonicChannelIngest({
        host : "::1",
        port : 1491
      });

      assert.ok(
        !(sonicChannelIngest.close()), "Channel close should not be executed"
      );
    });
  });
});
