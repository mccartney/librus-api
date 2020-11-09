# librus-api
[![npm](https://img.shields.io/npm/v/librus-api.svg?style=flat)](https://www.npmjs.com/package/librus-api)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat)](http://opensource.org/licenses/MIT)

Technically a fork of
[rzymek/librus-api](https://github.com/rzymek/librus-api), while practically
it's an extension of that NodeJS module.

The purpose is to deploy the Rzymek's NodeJS module to AWS Lambda, in order
to have all the incoming messages forwarded to your email (Librus only sends
notifications ~ "you have a message", but not the content itself)

## Installation:

1. `sudo npm install -g node-lambda`
2. `npm install`
3. In AWS eu-west-1 (Ireland region):
	1. Create IAM user called `2017-12-librus` with ability to deploy&run AWS Lambda
	2. Create IAM role called `LambdaSendsEmails` to be used by our AWS Lambda
		code, allowing it to send emails
	3. Verify domain for Email receiving and sending in AWS SES
4. Create a local `deploy.env` file with secrets:
```
LIBRUS_USER_NAME=1234567
LIBRUS_PASSWORD=librus_is_really_crap

EMAIL_FROM=make-sure-this-email-receives-notifications-from@librus.pl
EMAIL_TO=your-real-email@gmail.com
```
5. Test it locally with `node-lambda run -f deploy.env`
6. Deploy it to AWS with `node-lambda deploy -f deploy.env --environment rodzice --functionName=librus-notify-with-email`

## License
The MIT License (MIT)

Copyright (c) 2015/2016 Mateusz Bagiński

Copyright (c) 2017 Grzegorz Olędzki



Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
