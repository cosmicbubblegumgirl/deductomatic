# SA Tax Studio 3D

A cleaned, Docker-ready, VS Code-ready version of the tax calculator project.

## Included upgrades
- South African income tax in rands (ZAR)
- 2026 and 2027 tax years
- Age-based rebates and thresholds
- 3D interactive calculator keypad
- Custom display color modes and display size controls
- Theme switching, history, budget split, tax chart, and copy summary
- Clean filenames for Docker, Tekton, and Jasmine submission tasks
- VS Code workspace files and recommended extensions

## Run in VS Code
1. Open the folder in VS Code.
2. Install the recommended extensions when prompted.
3. Open the terminal and run:
   ```bash
   npm install
   npm start
   ```
4. Open `http://localhost:5500` in your browser.

## Run tests
```bash
npm test
```

## Run with Docker
```bash
docker build -t sa-tax-studio-3d .
docker run --rm -p 8080:80 sa-tax-studio-3d
```

You can also use Docker Compose:
```bash
docker compose up --build
```

## Useful VS Code tasks
Open the command palette and run **Tasks: Run Task**.
Available tasks:
- Install npm packages
- Run Jasmine tests
- Start local app
- Build Docker image
- Run Docker image
