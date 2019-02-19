# node-sonic-channel

[![Build Status](https://img.shields.io/travis/valeriansaliou/node-sonic-channel/master.svg)](https://travis-ci.org/valeriansaliou/node-sonic-channel) [![Test Coverage](https://img.shields.io/coveralls/valeriansaliou/node-sonic-channel/master.svg)](https://coveralls.io/github/valeriansaliou/node-sonic-channel?branch=master) [![NPM](https://img.shields.io/npm/v/sonic-channel.svg)](https://www.npmjs.com/package/sonic-channel) [![Downloads](https://img.shields.io/npm/dt/sonic-channel.svg)](https://www.npmjs.com/package/sonic-channel) [![Buy Me A Coffee](https://img.shields.io/badge/buy%20me%20a%20coffee-donate-yellow.svg)](https://www.buymeacoffee.com/valeriansaliou)

TODO

**🇫🇷 Crafted in Nantes, France.**

## Who uses it?

<table>
<tr>
<td align="center"><a href="https://crisp.chat/"><img src="https://valeriansaliou.github.io/node-sonic-channel/images/crisp.png" height="64" /></a></td>
</tr>
<tr>
<td align="center">Crisp</td>
</tr>
</table>

_👋 You use sonic-channel and you want to be listed there? [Contact me](https://valeriansaliou.name/)._

## How to install?

Include `sonic-channel` in your `package.json` dependencies.

Alternatively, you can run `npm install sonic-channel --save`.

## How to use?

TODO

## What is Sonic?

ℹ️ **Wondering what Sonic is?** Check out **[valeriansaliou/sonic](https://github.com/valeriansaliou/sonic)**.

## How is it linked to Sonic?

`node-sonic-channel` maintains persistent TCP connections to the Sonic network interfaces that are listening on your running Sonic instance. In case `node-sonic-channel` gets disconnected from Sonic, it will retry to connect once the connection is established again.

You can configure the connection details of your Sonic instance when initializing `node-sonic-channel` from your code; via the Sonic host and port.
