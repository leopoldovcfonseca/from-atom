// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const getRequest = require(`@google-cloud/nodejs-repo-tools`).getRequest;
const test = require(`ava`);

module.exports = (DATA_BACKEND) => {
  let originalDataBackend, id, testConfig, appConfig;

  test.before(() => {
    testConfig = require(`./_test-config`);
    appConfig = require(`../config`);
    originalDataBackend = appConfig.get(`DATA_BACKEND`);
    appConfig.set(`DATA_BACKEND`, DATA_BACKEND);
  });

  // setup a pta
  test.serial.cb(`should create a pta`, (t) => {
    getRequest(testConfig)
      .post(`/api/ptas`)
      .send({ pta_num: `my pta` })
      .expect(200)
      .expect((response) => {
        id = response.body.id;
        t.truthy(response.body.id);
        t.is(response.body.pta_num, `my pta`);
      })
      .end(t.end);
  });

  test.serial.cb(`should show a list of ptas`, (t) => {
    // Give Datastore time to become consistent
    setTimeout(() => {
      const expected = /<div class="media-body">/;
      getRequest(testConfig)
        .get(`/ptas`)
        .expect(200)
        .expect((response) => {
          t.regex(response.text, expected);
        })
        .end(t.end);
    }, 2000);
  });

  test.serial.cb(`should handle error`, (t) => {
    getRequest(testConfig)
      .get(`/ptas`)
      .query({ pageToken: `badrequest` })
      .expect(500)
      .end(t.end);
  });

  // delete the pta
  test.serial.cb((t) => {
    if (id) {
      getRequest(testConfig)
        .delete(`/api/ptas/${id}`)
        .expect(200)
        .end(t.end);
    } else {
      t.end();
    }
  });

  test.serial.cb(`should post to add ptaform`, (t) => {
    const expected = /Redirecting to \/ptas\//;
    getRequest(testConfig)
      .post(`/ptas/add`)
      .send(`pta_num=my%20pta`)
      .expect(302)
      .expect((response) => {
        const location = response.headers.location;
        const idPart = location.replace(`/ptas/`, ``);
        if (DATA_BACKEND !== `mongodb`) {
          id = parseInt(idPart, 10);
        } else {
          id = idPart;
        }
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should show add ptaform`, (t) => {
    const expected = /Add pta/;
    getRequest(testConfig)
      .get(`/ptas/add`)
      .expect(200)
      .expect((response) => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  // delete the pta
  test.serial.cb((t) => {
    if (id) {
      getRequest(testConfig)
        .delete(`/api/ptas/${id}`)
        .expect(200)
        .end(t.end);
    } else {
      t.end();
    }
  });

  // setup a pta
  test.serial.cb((t) => {
    getRequest(testConfig)
      .post(`/api/ptas`)
      .send({ pta_num: `my pta` })
      .expect(200)
      .expect((response) => {
        id = response.body.id;
        t.truthy(response.body.id);
        t.is(response.body.pta_num, `my pta`);
      })
      .end(t.end);
  });

  test.serial.cb(`should update a pta`, (t) => {
    const expected = new RegExp(`Redirecting to /ptas/${id}`);
    getRequest(testConfig)
      .post(`/ptas/${id}/edit`)
      .send(`pta_num=my%20other%20pta`)
      .expect(302)
      .expect((response) => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should show edit ptaform`, (t) => {
    const expected =
      /<input class="form-control" type="text" name="pta_num" id="pta_num" value="my other pta">/;
    getRequest(testConfig)
      .get(`/ptas/${id}/edit`)
      .expect(200)
      .expect((response) => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should show a pta`, (t) => {
    const expected = /<h4>my other pta&nbsp;<small><\/small><\/h4>/;
    getRequest(testConfig)
      .get(`/ptas/${id}`)
      .expect(200)
      .expect((response) => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should delete a pta`, (t) => {
    const expected = /Redirecting to \/ptas/;
    getRequest(testConfig)
      .get(`/ptas/${id}/delete`)
      .expect(302)
      .expect((response) => {
        id = undefined;
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  // clean up
  test.always.after.cb((t) => {
    appConfig.set(`DATA_BACKEND`, originalDataBackend);

    if (id) {
      getRequest(testConfig)
        .delete(`/api/ptas/${id}`)
        .expect(200)
        .end(t.end);
    } else {
      t.end();
    }
  });
};
