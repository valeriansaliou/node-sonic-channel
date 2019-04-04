/*
 * node-sonic-channel
 *
 * Copyright 2019, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var SonicChannelIngest = require("../").Ingest;

var assert = require("assert");


describe("node-sonic-channel/ingest", function() {
  describe("constructor", function() {
    it("should succeed creating an instance with valid options", function() {
      assert.doesNotThrow(
        function() {
          new SonicChannelIngest({
            host                : "::1",
            port                : 1491,
            auth                : "SecretPassword",
            offlineStackMaxSize : 0,
            emitQueueMaxSize    : 0
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

    it("should fail creating an instance with invalid auth", function() {
      assert.throws(
        function() {
          new SonicChannelIngest({
            host : "::1",
            port : 1491,
            auth : false
          });
        },

        "SonicChannelIngest should throw on invalid auth"
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

    it("should fail creating an instance with invalid emitQueueMaxSize",
      function() {
        assert.throws(
          function() {
            new SonicChannelIngest({
              host             : "::1",
              port             : 1491,
              emitQueueMaxSize : "10"
            });
          },

          "SonicChannelIngest should throw on invalid emitQueueMaxSize"
        );
      }
    );
  });

  describe("push method", function() {
    it("should defer push when offline", function() {
      var sonicChannelIngest = new SonicChannelIngest({
        host : "::1",
        port : 1491
      });

      var push = sonicChannelIngest.push(
        "messages", "default", "a6b1z", "valerian"
      );

      assert(
        (push instanceof Promise), "Push should be called"
      );
    });
  });

  describe("pop method", function() {
    it("should defer pop when offline", function() {
      var sonicChannelIngest = new SonicChannelIngest({
        host : "::1",
        port : 1491
      });

      var pop = sonicChannelIngest.pop(
        "messages", "default", "a6b1z", "valerian"
      );

      assert(
        (pop instanceof Promise), "Pop should be called"
      );
    });
  });

  describe("count method", function() {
    it("should defer count when offline", function() {
      var sonicChannelIngest = new SonicChannelIngest({
        host : "::1",
        port : 1491
      });

      var count = sonicChannelIngest.count("messages", "default", "a6b1z");

      assert(
        (count instanceof Promise), "Count should be called"
      );
    });
  });

  describe("flushc method", function() {
    it("should defer flushc when offline", function() {
      var sonicChannelIngest = new SonicChannelIngest({
        host : "::1",
        port : 1491
      });

      assert(
        (sonicChannelIngest.flushc("messages") instanceof Promise),
        "Flushc should be called"
      );
    });
  });

  describe("flushb method", function() {
    it("should defer flushb when offline", function() {
      var sonicChannelIngest = new SonicChannelIngest({
        host : "::1",
        port : 1491
      });

      assert(
        (sonicChannelIngest.flushb("messages", "default") instanceof Promise),
        "Flushb should be called"
      );
    });
  });

  describe("flusho method", function() {
    it("should defer flusho when offline", function() {
      var sonicChannelIngest = new SonicChannelIngest({
        host : "::1",
        port : 1491
      });

      var flusho = sonicChannelIngest.flusho("messages", "default", "a6b1z");

      assert(
        (flusho instanceof Promise), "Flusho should be called"
      );
    });
  });

  describe("close method", function() {
    it("should not close twice already closed channel", function() {
      var sonicChannelIngest = new SonicChannelIngest({
        host : "::1",
        port : 1491
      });

      assert(
        (sonicChannelIngest.close() instanceof Promise),
        "Channel close should be called"
      );
    });
  });
});
