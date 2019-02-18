# node-sonic-connector

[![Build Status](https://img.shields.io/travis/valeriansaliou/node-sonic-connector/master.svg)](https://travis-ci.org/valeriansaliou/node-sonic-connector) [![Test Coverage](https://img.shields.io/coveralls/valeriansaliou/node-sonic-connector/master.svg)](https://coveralls.io/github/valeriansaliou/node-sonic-connector?branch=master) [![NPM](https://img.shields.io/npm/v/sonic-connector.svg)](https://www.npmjs.com/package/sonic-connector) [![Downloads](https://img.shields.io/npm/dt/sonic-connector.svg)](https://www.npmjs.com/package/sonic-connector) [![Buy Me A Coffee](https://img.shields.io/badge/buy%20me%20a%20coffee-donate-yellow.svg)](https://www.buymeacoffee.com/valeriansaliou)

TODO

**🇫🇷 Crafted in Nantes, France.**

## Who uses it?

<table>
<tr>
<td align="center"><a href="https://crisp.chat/"><img src="https://valeriansaliou.github.io/node-sonic-connector/images/crisp.png" height="64" /></a></td>
</tr>
<tr>
<td align="center">Crisp</td>
</tr>
</table>

_👋 You use sonic-connector and you want to be listed there? [Contact me](https://valeriansaliou.name/)._

## How to install?

Include `sonic-connector` in your `package.json` dependencies.

Alternatively, you can run `npm install sonic-connector --save`.

## How to use?

TODO

## What is Sonic?

ℹ️ **Wondering what Sonic is?** Check out **[valeriansaliou/sonic](https://github.com/valeriansaliou/sonic)**.

## How is it linked to Sonic?

`node-sonic-connector` maintains persistent TCP connections to the Sonic network interfaces that are listening on your running Sonic instance. In case `node-sonic-connector` gets disconnected from Sonic, it will retry to connect once the connection is established again.

You can configure the connection details of your Sonic instance when initializing `node-sonic-connector` from your code; via the Sonic host and port.
