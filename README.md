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

The `config.default.js` file is used by default, but a similar `config.js` file can be created. The options are:
- __RATE_IN_MILLISECONDS__: Every how many milliseconds should the client send the information to the server
- __GET_PORT_URL__: The url that the client uses to get the Ngrok url. This is because ngrok expose an api to get information such as the used address.
- __GET_PUBLIC_IP_URL__: The url used to get the current public ip address. This is because to know it you should use an api call to an external service.
- __POST_PORT_URL__: Ther url of the server where you post the machine information.

The client is written in **Node.js** and uses **[axios](https://www.npmjs.com/package/axios)** and **[euberlog](https://www.npmjs.com/package/euberlog)** as external dependencies.

There is also a [service](https://github.com/eagletrt/eagletrt-telemetria-ip/blob/main/shell/shareip.service) that executes the client.

In order to use the client:
1) Clone this repository `git clone https://github.com/eagletrt/eagletrt-telemetria-ip`.
2) Move to the client `cd eagletrt-telemeta-ip/client`.
3) Install the dependencies `npm install`.
4) If you need it, copy the `config.default.js` file to `config.js` file by running `cp config.default.js config.js`.
5) In order to start locally the client run `npm start` inside the `client` folder.
6) In order to run it as a **service**, refer to [this file](https://github.com/eagletrt/eagletrt-telemetria-ip/blob/main/shell/shareip.service).

### Server

The server is hosted by **Heroku** and is written with **Node.js** and **express**, with **handlebars** used as view engine. The link of the currently hosted server is [https://eagletrt-telemetria-ip.herokuapp.com](https://eagletrt-telemetria-ip.herokuapp.com).

The **frontend** apis are:
- **GET /**: returns an html page showing the information of the machine **telemetria**.
- **GET /:machine**: returns an html page showing the information of the specified machine.

The **api** apis are:
- **GET /api/machines**: returns an array of currently stored **machines**. (This array updates every time a new machine is added by a POST).
- **GET /api/machines/:machine**: returns the information about the specified **machine**.
- **GET /api/machines/:machine/:field**: returns the value of the specified **field** of the specified **machine**.
- **POST /api/machines/:machine**: upserts the **machine** with the specified information.

In particular the **POST** body is something such as:
```json
{
    "ngrokUrl": "tcp://hostname:1234",
    "localIp": "192.168.1.1",
    "publicIp": "340.650.1.1",
    "user": "ubuntu"
}
```

While the result of a **GET**:
{
    "ngrokUrl": "tcp://hostname:1234",
    "host": "hostname",
    "port": "1234",
    "ssh": "ssh ubuntu@hostname -p 1234", 
    "localIp": "192.168.1.1",
    "publicIp": "340.650.1.1",
    "user": "ubuntu"
}
