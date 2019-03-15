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
            auth                : "SecretPassword",
            offlineStackMaxSize : 0,
            textMaximumLength   : 1000
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

    it("should fail creating an instance with invalid textMaximumLength",
      function() {
        assert.throws(
          function() {
            new SonicChannelIngest({
              host              : "::1",
              port              : 1491,
              textMaximumLength : "20"
            });
          },

          "SonicChannelIngest should throw on invalid textMaximumLength"
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

      assert.ok(
        !(sonicChannelIngest.push("messages", "default", "a6b1z", "valerian")),
        "Push should be deferred"
      );
    });
  });

  describe("pop method", function() {
    it("should defer pop when offline", function() {
      var sonicChannelIngest = new SonicChannelIngest({
        host : "::1",
        port : 1491
      });

      assert.ok(
        !(sonicChannelIngest.pop("messages", "default", "a6b1z", "valerian")),
        "Pop should be deferred"
      );
    });
  });

  describe("count method", function() {
    it("should defer count when offline", function() {
      var sonicChannelIngest = new SonicChannelIngest({
        host : "::1",
        port : 1491
      });

      assert.ok(
        !(sonicChannelIngest.count("messages", "default", "a6b1z")),
        "Count should be deferred"
      );
    });
  });

  describe("flushc method", function() {
    it("should defer flushc when offline", function() {
      var sonicChannelIngest = new SonicChannelIngest({
        host : "::1",
        port : 1491
      });

      assert.ok(
        !(sonicChannelIngest.flushc("messages")),
        "Flushc should be deferred"
      );
    });
  });

  describe("flushb method", function() {
    it("should defer flushb when offline", function() {
      var sonicChannelIngest = new SonicChannelIngest({
        host : "::1",
        port : 1491
      });

      assert.ok(
        !(sonicChannelIngest.flushb("messages", "default")),
        "Flushb should be deferred"
      );
    });
  });

  describe("flusho method", function() {
    it("should defer flusho when offline", function() {
      var sonicChannelIngest = new SonicChannelIngest({
        host : "::1",
        port : 1491
      });

      assert.ok(
        !(sonicChannelIngest.flusho("messages", "default", "a6b1z")),
        "Flusho should be deferred"
      );
    });
  });

  describe("trigger method", function() {
    it("should defer trigger when offline", function() {
      var sonicChannelIngest = new SonicChannelIngest({
        host : "::1",
        port : 1491
      });

      assert.ok(
        !(sonicChannelIngest.trigger("consolidate")),
        "Trigger should be deferred"
      );
    });
  });

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
