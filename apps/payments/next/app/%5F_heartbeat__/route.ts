/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { NextResponse } from 'next/server';

import { getApp } from '../nestapp/app';

export async function GET(request: Request) {
  await getApp();
  const resp = new NextResponse('{}');
  resp.headers.set('Content-Type', 'application/json');
  return resp;
}
