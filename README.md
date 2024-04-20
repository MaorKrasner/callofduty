# Call Of Duty

Project for managing duties and soldiers. 
The project does basic operations like creating/deleting/changing new soldier/duty, schedule/cancel duty and more.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Credits](#credits)
- [License](#license)

## Installation

To install the project, you need to clone the repository:

```bash
git clone https://github.com/MaorKrasner/callofduty.git
```

After you clone the project, run npm install to get all the node modules

```bash
npm install
```

## Usage

To run the project follow the next steps :
    1. execute the command docker-compose up -d --build --> run this to start two containers of mongodb and the project, 
       you don't need to add -d and --build if there wasn't any changes in the code between the executions.
    2. MUST : execute the command npm run create-seeds to create the database and a few soldiers and duties.
    3. use postman/browser to create http requests. All project routes are mentioned below :
       [Health routes](src\routes\healthRoutes.ts)
       [Soldier routes](src\routes\soldierRoutes.ts)
       [Duty routes](src\routes\dutyRoutes.ts)
       [Justice board routes](src\routes\justiceBoardRoutes.ts)
    4. execute the command docker-compose down to stop the containers.
    5. IMPORTANT ! if you don't have the dist folder, the project will not work.
       Make sure you run the command npm run build before you start the project.

## Configuration

To configure the project, follow these steps:

1. **Environment Variables**: Set the following environment variables in your development or testing environment:
   - `SERVER_PORT` = 3000 --> the port that the app listens to
   - `DB_URI` = `mongodb://localhost:27017/` --> mongodb uri
   - `DB_NAME` = `callofdutydb` --> The database name

## Credits

This project utilizes the following libraries/framework :
- Fastify.js : Fast and low overhead web framework, for Node.js

Helpful Resources :
- [How to properly organize you folders in the project](https://medium.com/@jomote/the-art-of-organizing-a-guide-to-the-best-folder-structure-in-node-js-ddc377237625)
- [Everything you need to know about docker files](https://www.freecodecamp.org/news/the-docker-handbook/)

## License

[MIT](LICENSE)

Copyright © 2018 Tomas Della Vedova