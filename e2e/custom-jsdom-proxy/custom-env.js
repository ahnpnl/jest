import JSDOMModule from 'jsdom';
import BaseJSDOMEnvironment from '@jest/environment-jsdom-abstract';
import {JSDOMWithDummyLocation} from './CustomJSDOMLoc.js';

export default class CustomEnvironment extends BaseJSDOMEnvironment {
  constructor(config, context) {
    super(config, context, {...JSDOMModule, JSDOM: JSDOMWithDummyLocation});
  }
}
