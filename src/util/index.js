'use strict';

const BinaryPack = require('js-binarypack');
const Enum       = require('enum');

const clientMessages = new Enum([
  'SEND_OFFER',
  'SEND_ANSWER',
  'SEND_CANDIDATE',
  'SEND_LEAVE',
  'ROOM_JOIN',
  'ROOM_LEAVE',
  'ROOM_GET_LOGS',
  'ROOM_GET_USERS',
  'ROOM_SEND_DATA',
  'SFU_GET_OFFER',
  'SFU_ANSWER',
  'SFU_CANDIDATE',
  'PING',
  'UPDATE_CREDENTIAL',
]);

const serverMessages = new Enum([
  'OPEN',
  'ERROR',
  'OFFER',
  'ANSWER',
  'CANDIDATE',
  'LEAVE',
  'AUTH_EXPIRES_IN',
  'ROOM_LOGS',
  'ROOM_USERS',
  'ROOM_DATA',
  'ROOM_USER_JOIN',
  'ROOM_USER_LEAVE',
  'SFU_OFFER',
]);

/**
 * Class that contains utility functions.
 */
class Util {
  /**
   * Create a Util instance.
   */
  constructor() {
    this.DISPATCHER_HOST = 'dispatcher.skyway.io';
    this.DISPATCHER_PORT = 443;
    this.DISPATCHER_SECURE = true;
    this.DISPATCHER_TIMEOUT = 3000;

    this.TURN_HOST = 'turn.skyway.io';
    this.TURN_PORT = 443;

    this.debug = false;

    this.pack = BinaryPack.pack;
    this.unpack = BinaryPack.unpack;

    this.setZeroTimeout = undefined;


    this.MESSAGE_TYPES = {
      CLIENT: clientMessages,
      SERVER: serverMessages,
    };

    this.chunkedBrowsers = {Chrome: 1};
    // Current recommended maximum chunksize is 16KB (DataChannel spec)
    // https://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-13
    // The actual chunk size is adjusted in dataChannel to accomodate metaData
    this.maxChunkSize = 16300;

    // Number of reconnection attempts to the same server before giving up
    this.reconnectionAttempts = 2;

    // Number of times to try changing servers before giving up
    this.numberServersToTry = 3;

    // Send loop interval in milliseconds
    this.sendInterval = 1;

    // Ping interval in milliseconds
    this.pingInterval = 25000;

    this.defaultConfig = {
      iceServers: [{
        urls: 'stun:stun.skyway.io:3478',
        url:  'stun:stun.skyway.io:3478',
      }],
      iceTransportPolicy: 'all',
    };

    // Returns the current browser.
    this.browser = (function() {
      if (window.mozRTCPeerConnection) {
        return 'Firefox';
      }
      if (window.webkitRTCPeerConnection) {
        return 'Chrome';
      }
      if (window.RTCPeerConnection) {
        return 'Supported';
      }
      return 'Unsupported';
    })();
  }

  /**
   * Validate the Peer ID format.
   * @param {string} [id] - A Peer ID.
   * @return {boolean} True if the peerId format is valid. False if not.
   */
  validateId(id) {
    // Allow empty ids
    return !id || /^[A-Za-z0-9_-]+(?:[ _-][A-Za-z0-9]+)*$/.exec(id);
  }

  /**
   * Validate the API key.
   * @param {string} [key] A SkyWay API key.
   * @return {boolean} True if the API key format is valid. False if not.
   */
  validateKey(key) {
    // Allow empty keys
    return !key || /^[a-z0-9]{8}(-[a-z0-9]{4}){3}-[a-z0-9]{12}$/.exec(key);
  }

  /**
   * Generate random token.
   * @return {string} A token consisting of random alphabet and integer.
   */
  randomToken() {
    return Math.random().toString(36).substr(2);
  }

  /**
   * Combine the sliced ArrayBuffers.
   * @param {Array} buffers - An Array of ArrayBuffer.
   * @return {ArrayBuffer} The combined ArrayBuffer.
   */
  joinArrayBuffers(buffers) {
    let size = buffers.reduce((sum, buffer) => {
      return sum + buffer.byteLength;
    }, 0);
    let tmpArray = new Uint8Array(size);
    let currPos = 0;
    for (let buffer of buffers) {
      tmpArray.set(new Uint8Array(buffer), currPos);
      currPos += buffer.byteLength;
    }
    return tmpArray.buffer;
  }

  /**
   * Convert Blob to ArrayBuffer.
   * @param {Blob} blob - The Blob to be read as ArrayBuffer.
   * @param {Function} cb - Callback function that called after load event fired.
   */
  blobToArrayBuffer(blob, cb) {
    let fr = new FileReader();
    fr.onload = event => {
      cb(event.target.result);
    };
    fr.readAsArrayBuffer(blob);
  }

  /**
   * Convert Blob to BinaryString.
   * @param {Blob} blob - The Blob to be read as BinaryString.
   * @param {Function} cb - Callback function that called after load event fired.
   */
  blobToBinaryString(blob, cb) {
    let fr = new FileReader();
    fr.onload = event => {
      cb(event.target.result);
    };
    fr.readAsBinaryString(blob);
  }

  /**
   * Convert Blob to text.
   * @param {Blob} blob - The Blob to be read as text.
   * @param {Function} cb - Callback function that called after load event fired.
   */
  blobToString(blob, cb) {
    let fr = new FileReader();
    fr.onload = event => {
      cb(event.target.result);
    };
    fr.readAsText(blob);
  }

  /**
   * Convert BinaryString to ArrayBuffer.
   * @param {BinaryString} binary - The BinaryString that is converted to ArrayBuffer.
   * @return {string} An ArrayBuffer.
   */
  binaryStringToArrayBuffer(binary) {
    let byteArray = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i) & 0xff;
    }
    return byteArray.buffer;
  }

  /**
   * Return random ID.
   * @return {string} A text consisting of 16 chars.
   */
  randomId() {
    const keyLength = 16;
    // '36' means that we want to convert the number to a string using chars in
    // the range of '0-9a-z'. The concatenated 0's are for padding the key,
    // as Math.random() may produce a key shorter than 16 chars in length
    const randString = Math.random().toString(36) + '0000000000000000000';
    return randString.substr(2, keyLength);
  }

  /**
   * Whether the protocol is https or not.
   * @return {boolean} Whether the protocol is https or not.
   */
  isSecure() {
    return location.protocol === 'https:';
  }
}

module.exports = new Util();
