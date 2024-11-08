/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';
var _ = require('lodash');

var BufferUtil = require('./util/buffer');
var JSUtil = require('./util/js');
var networks = [];
var networkMaps = {};

/**
 * A network is merely a map containing values that correspond to version
 * numbers for each bitcoin network. Currently only supporting "livenet"
 * (a.k.a. "mainnet") and "testnet".
 * @constructor
 */
function Network() {}

Network.prototype.toString = function toString() {
  return this.name;
};

/**
 * @function
 * @member Networks#get
 * Retrieves the network associated with a magic number or string.
 * @param {string|number|Network} arg
 * @param {string|Array} keys - if set, only check if the magic number associated with this name matches
 * @returns {Network}
 */
function get(arg, keys) {
  if (~networks.indexOf(arg)) {
    return arg;
  }
  if (keys) {
    if (!_.isArray(keys)) {
      keys = [keys];
    }
    var containsArg = function (key) {
      return networks[index][key] === arg;
    };
    for (var index in networks) {
      if (_.some(keys, containsArg)) {
        return networks[index];
      }
    }
    return undefined;
  }

  var network = networkMaps[arg];

  if (
    network &&
    network === testnet &&
    (arg === 'local' || arg === 'regtest')
  ) {
    enableRegtest();
  }

  return network;
}

/**
 * @function
 * @member Networks#add
 * Will add a custom Network
 * @param {Object} data
 * @param {string} data.name - The name of the network
 * @param {string|string[]} data.alias - The aliased name of the network
 * @param {Number} data.pubkeyhash - The publickey hash prefix
 * @param {Number} data.privatekey - The privatekey prefix
 * @param {Number} data.scripthash - The scripthash prefix
 * @param {Number} data.xpubkey - The extended public key magic for BIP32
 * @param {Number} data.xprivkey - The extended private key magic for BIP32
 * @param {Number} data.xpubkey256bit - The extended public key magic for DIP14
 * @param {Number} data.xprivkey256bit - The extended private key magic for DIP14
 * @param {Number} data.networkMagic - The network magic number
 * @param {Number} data.port - The network port
 * @param {Array}  data.dnsSeeds - An array of dns seeds
 * @return {Network}
 */
function addNetwork(data) {
  var network = new Network();

  JSUtil.defineImmutable(network, {
    name: data.name,
    alias: data.alias,
    pubkeyhash: data.pubkeyhash,
    privatekey: data.privatekey,
    scripthash: data.scripthash,
    xpubkey: data.xpubkey,
    xprivkey: data.xprivkey,
    //xpubkey256bit: data.xpubkey256bit,
    //xprivkey256bit: data.xprivkey256bit
  });

  if (data.networkMagic) {
    JSUtil.defineImmutable(network, {
      networkMagic: BufferUtil.integerAsBuffer(data.networkMagic),
    });
  }

  if (data.port) {
    JSUtil.defineImmutable(network, {
      port: data.port,
    });
  }

  if (data.dnsSeeds) {
    JSUtil.defineImmutable(network, {
      dnsSeeds: data.dnsSeeds,
    });
  }
  _.each(network, function (value) {
    if (!_.isUndefined(value) && !_.isObject(value)) {
      networkMaps[value] = network;
    }

    if (Array.isArray(value)) {
      value.forEach(function (v) {
        networkMaps[v] = network;
      });
    }
  });

  networks.push(network);

  return network;
}

/**
 * @function
 * @member Networks#remove
 * Will remove a custom network
 * @param {Network} network
 */
function removeNetwork(network) {
  for (var i = 0; i < networks.length; i++) {
    if (networks[i] === network) {
      networks.splice(i, 1);
    }
  }
  for (var key in networkMaps) {
    if (networkMaps[key] === network) {
      delete networkMaps[key];
    }
  }
}

addNetwork({
  name: 'livenet',
  alias: 'mainnet',
  pubkeyhash: 0x3f,
  privatekey: 0x4b,
  scripthash: 0x0f,
  xpubkey: 0x488b21e,    // 'xpub' (Bitcoin Default)
  xprivkey: 0x488ade4,   // 'xprv' (Bitcoin Default)
  //xpubkey256bit: 0x0eecefc5,    // 'dpmp' (dashpay mainnet public)
  //xprivkey256bit: 0x0eecf02e,   // 'dpms' (dashpay mainnet secret)
  //networkMagic: 0x2e6d7472,
  networkMagic: 0x4f534d49, //try it another way... 
  port: 9969,
  dnsSeeds: [
    'dnsseed.osmium.space',
    '144.126.129.62',
    '213.199.51.69',
    '94.72.99.99',
  ],
});

/**
 * @instance
 * @member Networks#livenet
 */
var livenet = get('livenet');

addNetwork({
  name: 'testnet',
  alias: ['regtest', 'devnet', 'evonet', 'local'],
  pubkeyhash: 0x7d,
  privatekey: 0xef,
  scripthash: 0x0c,
  xpubkey:    0x043587cf,    // 'tpub' (Bitcoin Default)
  xprivkey:   0x04358394,   // 'tprv' (Bitcoin Default)
  //xpubkey256bit:    0x0eed270b,   // 'dptp' (dashpay testnet public) 
  //xprivkey256bit:   0x0eed2774// 'dpts' (dashpay testnet secret)
});

/**
 * @instance
 * @member Networks#testnet
 */
var testnet = get('testnet');

// Add configurable values for testnet/regtest

var TESTNET = {
  PORT: 19969,
  NETWORK_MAGIC: BufferUtil.integerAsBuffer(0x744f534d),
  DNS_SEEDS: [
    '144.126.129.62',
    '213.199.51.69',
    '94.72.99.99',
  ],
};

for (var key in TESTNET) {
  if (!_.isObject(TESTNET[key])) {
    networkMaps[TESTNET[key]] = testnet;
  }
}

var REGTEST = {
  PORT: 19899,
  NETWORK_MAGIC: BufferUtil.integerAsBuffer(0xfcc1b7dc),
  DNS_SEEDS: [],
};

for (var key in REGTEST) {
  if (!_.isObject(REGTEST[key])) {
    networkMaps[REGTEST[key]] = testnet;
  }
}

Object.defineProperty(testnet, 'port', {
  enumerable: true,
  configurable: false,
  get: function () {
    if (this.regtestEnabled) {
      return REGTEST.PORT;
    } else {
      return TESTNET.PORT;
    }
  },
});

Object.defineProperty(testnet, 'networkMagic', {
  enumerable: true,
  configurable: false,
  get: function () {
    if (this.regtestEnabled) {
      return REGTEST.NETWORK_MAGIC;
    } else {
      return TESTNET.NETWORK_MAGIC;
    }
  },
});

Object.defineProperty(testnet, 'dnsSeeds', {
  enumerable: true,
  configurable: false,
  get: function () {
    if (this.regtestEnabled) {
      return REGTEST.DNS_SEEDS;
    } else {
      return TESTNET.DNS_SEEDS;
    }
  },
});

/**
 * @function
 * @member Networks#enableRegtest
 * Will enable regtest features for testnet
 */
function enableRegtest() {
  testnet.regtestEnabled = true;
}

/**
 * @function
 * @member Networks#disableRegtest
 * Will disable regtest features for testnet
 */
function disableRegtest() {
  testnet.regtestEnabled = false;
}

/**
 * @namespace Networks
 */
module.exports = {
  add: addNetwork,
  remove: removeNetwork,
  defaultNetwork: livenet,
  livenet: livenet,
  mainnet: livenet,
  testnet: testnet,
  get: get,
  enableRegtest: enableRegtest,
  disableRegtest: disableRegtest,
};
