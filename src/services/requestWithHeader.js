import { XMLHttpRequest as xhrPolyfill } from 'xmlhttprequest';
import CONFIG from '../constants/config';
import debug from 'debug';

const log = debug('request');

export function requestWithHeader (obj) {
  return new Promise((resolve, reject) => {

    let url = obj.url;

    if (!url) {
      reject(new Error('URL is missing'));
    }

    // server
    const xhr = typeof XMLHttpRequest === 'undefined' ? xhrPolyfill : XMLHttpRequest;
    /* eslint new-cap: "off" */
    let request = new xhr();

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        console.log(request.responseText);
        resolve(request.responseText);
      } else {
        console.log(request.status);
        let failureMessage = `Error fetching url:${url}; status code:${request.status}`;
        reject(new Error(failureMessage));
      }
    };

    request.ontimeout = (e) => {
      console.log('ontimeout', e);
    };

    request.onreadystatechange = () => {
      if (request.status === 404) {
        reject(new Error(`Error fetching url:${url}; status code:${request.status}`));
      }
    };

    request.onerror = () => {
      console.log(request.responseText);
      log(`Request failed with error ${request.responseText}`);
      reject(new Error(request.responseText));
    };

    request.open(obj.method || 'GET', url);

    request.withCredentials = true;
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('x-api-key', CONFIG.PureStakeAPIKey);

    if (obj.body) {
      request.send(JSON.stringify(obj.body));
    } else {
      request.send();
    }
  });
}
