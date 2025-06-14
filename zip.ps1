$ErrorActionPreference = "Stop"

$source = "$PSScriptRoot/dist"
$destination = "$PSScriptRoot/delayo_X_X_X.zip"

$excludes = @("*.map", "*.bak", "*.test.*", "*.DS_Store", "*.log", "Thumbs.db", ".git*", ".vscode", "node_modules")

if (Test-Path $destination) {
    Remove-Item $destination
}

$filesToZip = Get-ChildItem -Path $source -Recurse -File | Where-Object {
    $include = $true
    foreach ($pattern in $excludes) {
        if ($_.Name -like $pattern) { $include = $false }
    }
    return $include
}

$tempDir = Join-Path $env:TEMP "delayo_zip_temp"
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $tempDir | Out-Null

foreach ($file in $filesToZip) {
    $relativePath = $file.FullName.Substring($source.Length + 1)
    $targetPath = Join-Path $tempDir $relativePath
    New-Item -ItemType Directory -Path (Split-Path $targetPath) -Force | Out-Null
    Copy-Item -Path $file.FullName -Destination $targetPath
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $destination

Remove-Item -Path $tempDir -Recurse -Force

Write-Host "✅ delayo_X_X_X.zip successfully created"
