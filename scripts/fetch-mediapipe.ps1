$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$wasmSrc = Join-Path $root "node_modules\@mediapipe\tasks-vision\wasm"
$wasmDst = Join-Path $root "public\wasm"
$modelsDst = Join-Path $root "public\models"
$modelUrl = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"

New-Item -ItemType Directory -Force -Path $wasmDst, $modelsDst | Out-Null

if (Test-Path (Join-Path $wasmSrc "vision_wasm_internal.wasm")) {
  Copy-Item -Path (Join-Path $wasmSrc "*") -Destination $wasmDst -Force
  Write-Output "wasm copied from node_modules"
} else {
  throw "未找到 @mediapipe/tasks-vision wasm，请先 npm install"
}

$modelFile = Join-Path $modelsDst "pose_landmarker_lite.task"
if (-not (Test-Path $modelFile) -or (Get-Item $modelFile).Length -lt 1000000) {
  Invoke-WebRequest -Uri $modelUrl -OutFile $modelFile -TimeoutSec 300
  Write-Output "pose model downloaded"
} else {
  Write-Output "pose model already present"
}
