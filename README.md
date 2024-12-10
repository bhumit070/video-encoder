# Video Encoder

## Tasks

### Backend

- [ ] Generate thumbnail.
- [ ] Handle upscale and downscale.
- [ ] Create Easy setup script.
- [ ] Update video list api to include available qualities for the video.

### Frontend

- [ ] Video names should be displayed in 2 lines and then ellipsis should be triggered.
- [ ] Make video list scrollable.
- [ ] Update video upload form to include (name, thumbnail).
- [ ] Show in which quality video is available.
- [ ] Add ability to switch video quality.
- [ ] Add ability to switch in multiple audio if available.

## Requirements

- [Docker](https://docs.docker.com/engine/install/)
- [Bruno](https://www.usebruno.com/downloads)

## Project Setup

### Backend Setup

- Create a .env file by executing below command
  
```sh
copy .env.example .env
```

- Now put values inside .env file

- Now run the project using docker
- Go to docker folder by running and run below command

```sh
cd docker
```

```sh
docker compose -f docker.compose.yaml up
```

### Frontend Setup

- Switch to client directory

```sh
cd client
```

- Install dependencies

```sh
npm install
```

- Run the project

```sh
npm run dev
```

### Api client setup

- Open the `api_collection` folder in bruno and you will have all the apis available in the bruno.

### LocalStack Setup

- This step is optional, your data won't be saved when you delete the container if you skip this step.
- Create account on [local stack site](https://app.localstack.cloud)
- Generate auth token
- Pass in `./docker/docker.compose.yaml` file where env name is `LOCALSTACK_AUTH_TOKEN`
