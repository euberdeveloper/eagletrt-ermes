# eagletrt-telemetria-ip

The project that makes remote access to the telemetry very easy.

## Project purpose

When the raspberry of the telemetry is connected to the internet, it has not a public IP address and also its local ip is not static. This makes it difficult to access to it locally via ssh and impossible by another net. This project allows exactly that.

## The solution

### First solution: Ngrok

We firstly used a reverse ssh by using a server with public IP address. The problem was that after a while that server was not anymore available to us, hence we started using **ngrok**. 

You can install ngrok from [here](https://ngrok.com/download) and it is needed to be installed only on the raspberry side.

The ngrok is automatically started with a [service](https://github.com/eagletrt/eagletrt-telemetria-ip/blob/main/shell/ngrok.service) and opens an ssh tunnel with a certain **hostname** and **port**. (**Note:** the port is usually **not** 22, hence you should use the `-p PORT` parameter of the `ssh` command).

We now suggest to use the zerotier solution instead, but ngrok is still maintained as a second option.

#### Usage

There is a [shell script](https://github.com/eagletrt/eagletrt-telemetria-ip/blob/main/shell/shi.sh) that calls the api and executes automatically the shell command.

### Second solution: Zerotier + mosh

It came out that there where some problems of synchronization of ip with ngrok so we decided to implement a parallel solution which allows us to connect to the rapsberry in an alternative way by using **zerotier**; moreover to reduce latency we decided to use the ssh wrapper **mosh**.

#### Zerotier setup

First of all we sign up to [zerotier](https://www.zerotier.com/) to be able to create a network. This network is set to private to be able to control accesses and it auto-assigns ip in the 192.168.195.* range.

Then, all clients which want to connect to the created zerotier network need to install zerotier client with `curl -s https://install.zerotier.com | sudo bash`, although it is installed manually all updates of the service will be managed by **apt**.

After that you can join the previously created network, which id's can be found in the zerotier dashboard, with `sudo zerotier-cli join <network ID>`, if you receive an error like `zerotier-cli: missing port and zerotier-one.port not found in /var/lib/zerotier-one` manually start zerotier-cli with `sudo service zerotier-one start` and repeat. After authorizing the client throw zerotier dashboard you can see your **IP address** in the zerotier network with `ip addr sh | grep 'inet.*zt'`.

#### Zerotier usage

Now it is possible to connect to all devices in the same network as if they are part of a LAN, for example you can connect via ssh with `ssh <username>@<zerotier IP>`. All ip's are static within the network so it is not necessary to update the ssh command, moreover it is suggested to **login with private/public key** instead of using passowrd to do so you can generate keys with `ssh-keygen` and send them to the server with `ssh-copy-id -i <key path> <user>@<server>`.

#### Mosh setup

It is required to install [mosh](https://mosh.org/#getting) both on client and server with `sudo apt-get install mosh`. After that you need to disable local variables acceptance form the server, to do so you need to edit `/etc/ssh/sshd_config` and comment the line `AcceptEnv LANG LC_*`.

#### Mosh usage

To connect to a client with mosh use `mosh <user>@<server>`.


## Client and server

### Client Nodejs

Another problem was that ngrok did not use always the same hostname and the same port. Hence, we made a **client** that continuously sends to a server (hosted with heroku) its information. Even if zerotier keeps the same ip, this client is still useful.

The information sent to the server is:
* The __local ip__ address, useful because it is not static.
* The __public ip__ address, I do not know why.
* The __ngrok url__, in order to use the ssh.
* The __zerotier_id__, in order to connect to the zerotier network.
* The __zerotier_ip__, in order to connect to the right ip and have the ssh command.
* The __username__, for scalability in case of other machines using this client.

The `config.default.js` file is used by default, but a similar `config.js` file can be created. The options are:
- __RATE_IN_MILLISECONDS__: Every how many milliseconds should the client send the information to the server
- __GET_PORT_URL__: The url that the client uses to get the Ngrok url. This is because ngrok expose an api to get information such as the used address.
- __GET_PUBLIC_IP_URL__: The url used to get the current public ip address. This is because to know it you should use an api call to an external service.
- __GET_ZEROTIER_INFO_COMMAND__: The command used to get the information from zerotier.
- __POST_PORT_URL__: Ther url of the server where you post the machine information.

The client is written in **Node.js** and uses **[axios](https://www.npmjs.com/package/axios)**, **[shelljs](https://www.npmjs.com/package/shelljs)** and **[euberlog](https://www.npmjs.com/package/euberlog)** as external dependencies.

There is also a [service](https://github.com/eagletrt/eagletrt-telemetria-ip/blob/main/shell/shareip.service) that executes the client.

In order to use the client:
1) Clone this repository `git clone https://github.com/eagletrt/eagletrt-telemetria-ip`.
2) Move to the client `cd eagletrt-telemeta-ip/client/node`.
3) Install the dependencies `npm install`.
4) Only if you need to change the default options, copy the `config.default.js` file to `config.js` file by running `cp config.default.js config.js`.
5) In order to start locally the client run `npm start` inside the `client` folder.
6) In order to run it as a **service**, refer to [this file](https://github.com/eagletrt/eagletrt-telemetria-ip/blob/main/shell/ipshare-node.service).

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
    "zerotierId": "xxxxxxx",
    "zerotierIp": "192.168.195.23",
    "user": "ubuntu"
}
```

While the result of a **GET**:
```json
{
    "ngrokUrl": "tcp://hostname:1234",
    "ngrokHost": "hostname",
    "ngrokPort": "1234",
    "zerotierId": "xxxxxxx",
    "zerotierIp": "192.168.195.23",
    "zerotierSsh": "ssh username@192.168.195.23",
    "zerotierJoin": "zerotier-cli join xxxxxxx",
    "ssh": "ssh ubuntu@hostname -p 1234", 
    "localIp": "192.168.1.1",
    "publicIp": "340.650.1.1",
    "user": "ubuntu"
}
```

### Site and api

Both the site and the api are served by the url https://eagletrt-telemetria-ip.herokuapp.com
