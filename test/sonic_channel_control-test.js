/*
 * node-sonic-channel
 *
 * Copyright 2019, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var SonicChannelControl = require("../").Control;

var assert = require("assert");


describe("node-sonic-channel/control", function() {
  describe("constructor", function() {
    it("should succeed creating an instance with valid options", function() {
      assert.doesNotThrow(
        function() {
          new SonicChannelControl({
            host                : "::1",
            port                : 1491,
            auth                : "SecretPassword",
            offlineStackMaxSize : 0,
            emitQueueMaxSize    : 0
          });
        },

        "SonicChannelControl should not throw on valid options"
      );
    });

    it("should fail creating an instance with missing host", function() {
      assert.throws(
        function() {
          new SonicChannelControl({
            port : 1491
          });
        },

        "SonicChannelControl should throw on missing host"
      );
    });

    it("should fail creating an instance with missing port", function() {
      assert.throws(
        function() {
          new SonicChannelControl({
            host : "::1"
          });
        },

        "SonicChannelControl should throw on missing port"
      );
    });

    it("should fail creating an instance with invalid port", function() {
      assert.throws(
        function() {
          new SonicChannelControl({
            host : "::1",
            port : -40
          });
        },

        "SonicChannelControl should throw on invalid port"
      );
    });

    it("should fail creating an instance with invalid auth", function() {
      assert.throws(
        function() {
          new SonicChannelControl({
            host : "::1",
            port : 1491,
            auth : false
          });
        },

        "SonicChannelControl should throw on invalid auth"
      );
    });

    it("should fail creating an instance with invalid offlineStackMaxSize",
      function() {
        assert.throws(
          function() {
            new SonicChannelControl({
              host                : "::1",
              port                : 1491,
              offlineStackMaxSize : "20"
            });
          },

          "SonicChannelControl should throw on invalid offlineStackMaxSize"
        );
      }
    );

    it("should fail creating an instance with invalid emitQueueMaxSize",
      function() {
        assert.throws(
          function() {
            new SonicChannelControl({
              host             : "::1",
              port             : 1491,
              emitQueueMaxSize : "10"
            });
          },

          "SonicChannelControl should throw on invalid emitQueueMaxSize"
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
            new SonicChannelControl({
              host                : "::1",
              port                : 1491,
              offlineStackMaxSize : 100,
              emitQueueMaxSize    : 10
            });
          },

          (
            "SonicChannelControl should throw on offlineStackMaxSize " +
              "greater than emitQueueMaxSize"
          )
        );
      }
    );
  });

  describe("trigger method", function() {
    it("should defer trigger when offline", function() {
      var sonicChannelControl = new SonicChannelControl({
        host : "::1",
        port : 1491
      });

      assert(
        (sonicChannelControl.trigger("consolidate") instanceof Promise),
        "Trigger should be called"
      );
    });
  });

  describe("info method", function() {
    it("should defer info when offline", function() {
      var sonicChannelControl = new SonicChannelControl({
        host : "::1",
        port : 1491
      });

      assert(
        (sonicChannelControl.info() instanceof Promise),
        "Info should be called"
      );
    });
  });

  describe("close method", function() {
    it("should not close twice already closed channel", function() {
      var sonicChannelControl = new SonicChannelControl({
        host : "::1",
        port : 1491
      });

      assert(
        (sonicChannelControl.close() instanceof Promise),
        "Channel close should be called"
      );
    });
  });
});
