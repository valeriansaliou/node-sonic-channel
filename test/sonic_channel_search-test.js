/*
 * node-sonic-channel
 *
 * Copyright 2019, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var SonicChannelSearch = require("../").Search;

var assert = require("assert");


describe("node-sonic-channel/search", function() {
  describe("constructor", function() {
    it("should succeed creating an instance with valid options", function() {
      assert.doesNotThrow(
        function() {
          new SonicChannelSearch({
            host                : "::1",
            port                : 1491,
            auth                : "SecretPassword",
            offlineStackMaxSize : 0,
            emitQueueMaxSize    : 0
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

    it("should fail creating an instance with invalid emitQueueMaxSize",
      function() {
        assert.throws(
          function() {
            new SonicChannelSearch({
              host             : "::1",
              port             : 1491,
              emitQueueMaxSize : "10"
            });
          },

          "SonicChannelSearch should throw on invalid emitQueueMaxSize"
        );
      }
    );

    it(
      (
        "should fail creating an instance with a greater " +
          "offlineStackMaxSize than emitQueueMaxSize"
      ),

      function() {
        assert.throws(
          function() {
            new SonicChannelSearch({
              host                : "::1",
              port                : 1491,
              offlineStackMaxSize : 100,
              emitQueueMaxSize    : 10
            });
          },

          (
            "SonicChannelSearch should throw on offlineStackMaxSize " +
              "greater than emitQueueMaxSize"
          )
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

      var query = sonicChannelSearch.query(
        "messages", "default", "valerian saliou"
      );

      assert(
        (query instanceof Promise), "Query should be called"
      );
    });
  });

  describe("suggest method", function() {
    it("should defer suggest when offline", function() {
      var sonicChannelSearch = new SonicChannelSearch({
        host : "::1",
        port : 1491
      });

      var suggest = sonicChannelSearch.suggest(
        "messages", "default", "valerian"
      );

      assert(
        (suggest instanceof Promise), "Suggest should be called"
      );
    });
  });

  describe("list method", function() {
    it("should defer list when offline", function() {
      var sonicChannelSearch = new SonicChannelSearch({
        host : "::1",
        port : 1491
      });

      var list = sonicChannelSearch.list(
        "messages", "default"
      );

      assert(
        (list instanceof Promise), "List should be called"
      );
    });
  });

  describe("close method", function() {
    it("should not close twice already closed channel", function() {
      var sonicChannelSearch = new SonicChannelSearch({
        host : "::1",
        port : 1491
      });

      assert(
        (sonicChannelSearch.close() instanceof Promise),
        "Channel close should be called"
      );
    });
  });
});
