# react-native-expo-devcontainer-template

This template provides an example for setting up a development environment for React Native Expo applications using Dev Containers. 
To set up the container, please follow the instructions below:

## Prerequisites

Ensure that you have the following installed on your machine:

- [VS Code](https://code.visualstudio.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) for VS Code
- [Expo Go](https://expo.dev/client) app on your smartphone

## Setup Instructions

1. Create a New Repository:

    - Navigate to the [original repository page](https://github.com/matsu3m/react-native-expo-devcontainer-template) on GitHub.
    - Click on `Use this template` to create a new repository based on this template.

2. Clone the Project:

    - Clone the newly created repository to your local machine.
    - Open the cloned project in VS Code.

3. Set Up Environment Variables:

    - In the `.devcontainer` directory of your project, create a `.env` file.
    - Add the following line to the `.env` file: `REACT_NATIVE_PACKAGER_HOSTNAME=192.168.xxx.xxx` - Replace `192.168.xxx.xxx` with your host machine's local IP address.

4. Reopen in Container:

    - Open the Command Palette in VS Code.
    - Select `Dev Containers: Reopen in Container`. VS Code will then start building the container and open the project inside it.

5. Start the Expo Server:

    - Once the container is running, open the terminal in VS Code.
    - Run the command `npm run start` to start the Expo server.
    - A QR code will appear in the terminal. Scan this with the Expo Go app on your smartphone to view the application.
