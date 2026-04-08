param()

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root 'frontend'
$nodePath = 'C:\Program Files\nodejs'
$pythonLauncher = 'py'
$healthUrl = 'http://localhost:3000/health'
$topSongsUrl = 'http://localhost:3000/top_songs'
$artistRankUrl = 'http://localhost:3000/artist_rank'
$dbConnection = [Environment]::GetEnvironmentVariable('JAZZ_DB_CONNECTION', 'User')
if ([string]::IsNullOrWhiteSpace($dbConnection)) {
  $dbConnection = 'DRIVER={SQL Server};SERVER=LAPTOP-66QDHQO7\SQLEXPRESS;DATABASE=JazzDB;Trusted_Connection=yes;'
}

function Fail-Step($message) {
  Write-Host $message -ForegroundColor Red
  exit 1
}

function Test-PythonModules {
  & $pythonLauncher -3 -c "import flask, flask_cors, pandas, pyodbc"
  return $LASTEXITCODE -eq 0
}

function Test-DatabaseConnection {
  $escapedConnection = $dbConnection.Replace("'", "''")
  & $pythonLauncher -3 -c "import pyodbc; pyodbc.connect(r'$escapedConnection').close()"
  return $LASTEXITCODE -eq 0
}

function Get-HealthyBackend {
  param([int]$Retries = 20)

  for ($index = 0; $index -lt $Retries; $index++) {
    try {
      $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 3
      if ($response.status -eq 'ok') {
        return $response
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  return $null
}

function Test-ExistingJazzApi {
  try {
    $songs = Invoke-RestMethod -Uri $topSongsUrl -TimeoutSec 3
    $artists = Invoke-RestMethod -Uri $artistRankUrl -TimeoutSec 3
    return ($songs -is [System.Array] -and $songs.Count -gt 0 -and $artists -is [System.Array] -and $artists.Count -gt 0)
  } catch {
    return $false
  }
}

if (-not (Test-Path $frontend)) {
  Fail-Step "Frontend folder not found: $frontend"
}

$env:Path = "$nodePath;$env:Path"

if (-not (Test-Path (Join-Path $nodePath 'node.exe'))) {
  Fail-Step 'Node.js was not found in C:\Program Files\nodejs.'
}

if (-not (Test-PythonModules)) {
  Fail-Step 'Missing Python packages. Install them with: py -3 -m pip install -r requirements.txt'
}

if (Test-DatabaseConnection) {
  Write-Host 'SQL Server check passed.' -ForegroundColor Green
} else {
  Write-Host 'SQL Server check failed. The backend will start in CSV fallback mode if needed.' -ForegroundColor Yellow
}

if (-not (Test-Path (Join-Path $frontend 'node_modules'))) {
  Write-Host 'Installing frontend dependencies...' -ForegroundColor Green
  & "$nodePath\npm.cmd" install --prefix $frontend
  if ($LASTEXITCODE -ne 0) {
    Fail-Step 'Failed to install frontend dependencies.'
  }
}

$backendCommand = "Set-Location '$root'; $pythonLauncher -3 SQL.py"
$frontendCommand = "Set-Location '$frontend'; `$env:Path='$nodePath;' + `$env:Path; & '$nodePath\npm.cmd' run dev -- --host 0.0.0.0"

$health = $null
if (Test-ExistingJazzApi) {
  Write-Host 'Existing Jazz API detected on port 3000. Reusing it.' -ForegroundColor Yellow
  try {
    $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 3
  } catch {
    $health = [pscustomobject]@{ status = 'ok'; storage = 'existing-api'; message = 'Health endpoint not available on the reused backend.' }
  }
} else {
  Write-Host 'Starting Flask backend...' -ForegroundColor Green
  Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCommand -WorkingDirectory $root | Out-Null

  Write-Host 'Waiting for backend health check...' -ForegroundColor Yellow
  $health = Get-HealthyBackend
  if ($null -eq $health) {
    if (Test-ExistingJazzApi) {
      $health = [pscustomobject]@{ status = 'ok'; storage = 'existing-api'; message = 'Reused a compatible API already running on port 3000.' }
    } else {
      Fail-Step 'Backend did not become healthy at http://localhost:3000/health and no compatible API was detected.'
    }
  }
}

Write-Host "Backend ready using storage mode: $($health.storage)" -ForegroundColor Green
if ($health.message) {
  Write-Host "Backend note: $($health.message)" -ForegroundColor Yellow
}

Write-Host 'Starting Vite frontend...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCommand -WorkingDirectory $frontend | Out-Null

Write-Host 'Jazz Dashboard launchers started.' -ForegroundColor Green
Write-Host 'Backend API: http://localhost:3000/top_songs' -ForegroundColor Cyan
Write-Host 'Frontend: check the Vite window for the exact local URL (usually http://localhost:5173)' -ForegroundColor Cyan