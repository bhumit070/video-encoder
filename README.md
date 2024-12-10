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

- Docker

## Project Setup

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
