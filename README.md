# eagletrt-telemetria-ip

The project that makes remote access to the telemetry very easy.

## Project purpose

When the raspberry of the telemetry is connected to the internet, it has not a public IP address and also its local ip is not static. This makes it difficult to access to it locally via ssh and impossible by another net. This project allows exactly that.

## How does it work

### Ngrok

We firstly used a reverse ssh by using a server with public IP address. The problem was that after a while that server was not anymore available to us, hence we started using **ngrok**. 

You can install ngrok from [here](https://ngrok.com/download).

The ngrok is automatically started with a [service](https://github.com/eagletrt/eagletrt-telemetria-ip/blob/main/shell/ngrok.service) and opens an ssh tunnel with a certain **hostname** and **port**. (**Note:** the port is usually **not** 22, hence you should use the `-p PORT` parameter of the `ssh` command).

### Client

Another problem was that ngrok did not use always the same hostname and the same port. Hence, we made a **client** that continuously sends to a server (hosted with heroku) its information.

The information sent to the server is:
* The __local ip__ address, useful because it is not static.
* The __public ip__ address, I do not know why.
* The __ngrok url__, in order to use the ssh.
* The __username__, for scalability in case of other machines using this client.

The client is written in **Node.js** and uses **[axios](https://www.npmjs.com/package/axios)** and **[euberlog](https://www.npmjs.com/package/euberlog)** as external dependencies.

There is also a [service](https://github.com/eagletrt/eagletrt-telemetria-ip/blob/main/shell/shareip.service) that executes the client.

In order to use the client:
1) Clone this repository `git clone https://github.com/eagletrt/eagletrt-telemetria-ip`.
2) Move to the client `cd eagletrt-telemeta-ip/client`.
3) Install the dependencies `npm install`.
4) If you need it, copy the `config.default.js` file to `config.js` file by running `cp config.default.js config.js`.
5) In order to start locally the client run `npm start` inside the `client` folder.
6) In order to run it as a **service**, refer to [this file](https://github.com/eagletrt/eagletrt-telemetria-ip/blob/main/shell/shareip.service).
