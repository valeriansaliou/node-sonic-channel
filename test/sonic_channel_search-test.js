/*
 * node-sonic-channel
 *
 * Copyright 2019, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var SonicChannelSearch = require("../").Search;

var assert = require("assert");


describe("node-sonic-channel", function() {
  describe("constructor", function() {
    it("should succeed creating an instance with valid options", function() {
      assert.doesNotThrow(
        function() {
          new SonicChannelSearch({
            host                : "::1",
            port                : 1491,
            auth                : "SecretPassword",
            offlineStackMaxSize : 0,
            textMaximumLength   : 1000
          });
        },

        "SonicChannelSearch should not throw on valid options"
      );
    });

    it("should fail creating an instance with missing host", function() {
      assert.throws(
        function() {
          new SonicChannelSearch({
            port : 1491
          });
        },

        "SonicChannelSearch should throw on missing host"
      );
    });

    it("should fail creating an instance with missing port", function() {
      assert.throws(
        function() {
          new SonicChannelSearch({
            host : "::1"
          });
        },

        "SonicChannelSearch should throw on missing port"
      );
    });

    it("should fail creating an instance with invalid port", function() {
      assert.throws(
        function() {
          new SonicChannelSearch({
            host : "::1",
            port : -40
          });
        },

        "SonicChannelSearch should throw on invalid port"
      );
    });

    it("should fail creating an instance with invalid auth", function() {
      assert.throws(
        function() {
          new SonicChannelSearch({
            host : "::1",
            port : 1491,
            auth : false
          });
        },

        "SonicChannelSearch should throw on invalid auth"
      );
    });

    it("should fail creating an instance with invalid offlineStackMaxSize",
      function() {
        assert.throws(
          function() {
            new SonicChannelSearch({
              host                : "::1",
              port                : 1491,
              offlineStackMaxSize : "20"
            });
          },

          "SonicChannelSearch should throw on invalid offlineStackMaxSize"
        );
      }
    );

    it("should fail creating an instance with invalid textMaximumLength",
      function() {
        assert.throws(
          function() {
            new SonicChannelSearch({
              host              : "::1",
              port              : 1491,
              textMaximumLength : "20"
            });
          },

          "SonicChannelSearch should throw on invalid textMaximumLength"
        );
      }
    );
  });

  describe("query method", function() {
    it("should defer query when offline", function() {
      var sonicChannelSearch = new SonicChannelSearch({
        host : "::1",
        port : 1491
      });

      assert.ok(
        !(sonicChannelSearch.query("messages", "default", "valerian saliou")),
        "Query should be deferred"
      );
    });
  });

  describe("suggest method", function() {
    it("should defer suggest when offline", function() {
      var sonicChannelSearch = new SonicChannelSearch({
        host : "::1",
        port : 1491
      });

      assert.ok(
        !(sonicChannelSearch.suggest("messages", "default", "valerian")),
        "Suggest should be deferred"
      );
    });
  });

  describe("close method", function() {
    it("should not close twice already closed channel", function() {
      var sonicChannelSearch = new SonicChannelSearch({
        host : "::1",
        port : 1491
      });

      assert.ok(
        !(sonicChannelSearch.close()), "Channel close should not be executed"
      );
    });
  });
});
