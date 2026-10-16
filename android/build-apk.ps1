# PowerShell Script to build Task-and-Reminder-Manager.apk

$ErrorActionPreference = "Stop"

$JDK_BIN = "C:\Program Files\Java\jdk-24\bin"
$JAVAC = Join-Path $JDK_BIN "javac.exe"
$JAR = Join-Path $JDK_BIN "jar.exe"
$KEYTOOL = Join-Path $JDK_BIN "keytool.exe"

$SDK_DIR = "C:\Users\pramo\AppData\Local\Android\Sdk"
$BUILD_TOOLS = Join-Path $SDK_DIR "build-tools\36.0.0"
$AAPT2 = Join-Path $BUILD_TOOLS "aapt2.exe"
$D8 = Join-Path $BUILD_TOOLS "d8.bat"
$ZIPALIGN = Join-Path $BUILD_TOOLS "zipalign.exe"
$APKSIGNER = Join-Path $BUILD_TOOLS "apksigner.bat"

$ANDROID_JAR = Join-Path $SDK_DIR "platforms\android-34\android.jar"

$PROJECT_ROOT = "E:\Vivriti\android"
$SRC_DIR = Join-Path $PROJECT_ROOT "src\main"
$RES_DIR = Join-Path $SRC_DIR "res"
$ASSETS_DIR = Join-Path $SRC_DIR "assets"
$MANIFEST = Join-Path $SRC_DIR "AndroidManifest.xml"
$JAVA_SRC = Join-Path $SRC_DIR "java\com\vivriti\taskmanager"

$BUILD_DIR = Join-Path $PROJECT_ROOT "build"
$OBJ_DIR = Join-Path $BUILD_DIR "obj"
$BIN_DIR = Join-Path $BUILD_DIR "bin"
$CLASSES_DIR = Join-Path $OBJ_DIR "classes"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "BUILDING TASK & REMINDER MANAGER APK" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Clean directories
Write-Host "`n[1/7] Preparing build directories..."
if (Test-Path $CLASSES_DIR) { Remove-Item -Path $CLASSES_DIR -Recurse -Force }
New-Item -ItemType Directory -Path $CLASSES_DIR -Force | Out-Null
New-Item -ItemType Directory -Path $OBJ_DIR -Force | Out-Null
New-Item -ItemType Directory -Path $BIN_DIR -Force | Out-Null

# 2. Compile resources with aapt2
Write-Host "[2/7] Compiling Android resources with aapt2..."
$resZip = Join-Path $OBJ_DIR "res.zip"
& $AAPT2 compile --dir $RES_DIR -o $resZip
if ($LASTEXITCODE -ne 0) { throw "aapt2 compile failed" }

# 3. Link resources and generate R.java + unaligned APK
Write-Host "[3/7] Linking resources and packaging assets..."
$unalignedApk = Join-Path $BIN_DIR "unaligned.apk"
& $AAPT2 link -o $unalignedApk `
  -I $ANDROID_JAR `
  --manifest $MANIFEST `
  --java $OBJ_DIR `
  -A $ASSETS_DIR `
  --auto-add-overlay `
  $resZip
if ($LASTEXITCODE -ne 0) { throw "aapt2 link failed" }

# 4. Compile Java sources
Write-Host "[4/7] Compiling Java source files with javac..."
$javaFiles = Get-ChildItem -Path $JAVA_SRC -Filter "*.java" | ForEach-Object { $_.FullName }
$rJava = Join-Path $OBJ_DIR "com\vivriti\taskmanager\R.java"
$allSources = @($javaFiles) + @($rJava)

& $JAVAC -cp "$ANDROID_JAR;$OBJ_DIR" -d $CLASSES_DIR --release 8 $allSources
if ($LASTEXITCODE -ne 0) { throw "javac compilation failed" }

# 5. Convert classes to DEX with d8
Write-Host "[5/7] Converting Java classes to classes.dex with d8..."
$classFiles = Get-ChildItem -Path $CLASSES_DIR -Recurse -Filter "*.class" | ForEach-Object { $_.FullName }
& $D8 --release --min-api 26 --output $BIN_DIR --lib $ANDROID_JAR $classFiles
if ($LASTEXITCODE -ne 0) { throw "d8 failed" }

$dexFile = Join-Path $BIN_DIR "classes.dex"
if (!(Test-Path $dexFile)) { throw "classes.dex not generated" }

# Add classes.dex into unaligned.apk
Push-Location $BIN_DIR
try {
  & $JAR -uf $unalignedApk classes.dex
  if ($LASTEXITCODE -ne 0) { throw "jar -uf failed" }
} finally {
  Pop-Location
}

# 6. Zipalign the APK
Write-Host "[6/7] Aligning APK with zipalign..."
$alignedApk = Join-Path $BIN_DIR "aligned.apk"
if (Test-Path $alignedApk) { Remove-Item -Path $alignedApk -Force }
& $ZIPALIGN -p 4 $unalignedApk $alignedApk
if ($LASTEXITCODE -ne 0) { throw "zipalign failed" }

# 7. Sign the APK
Write-Host "[7/7] Signing APK with apksigner..."
$keystore = Join-Path $PROJECT_ROOT "release.keystore"
if (!(Test-Path $keystore)) {
  Write-Host "Generating release keystore..."
  & $KEYTOOL -genkeypair -v -keystore $keystore -alias vivriti -keyalg RSA -keysize 2048 -validity 10000 -storepass vivriti123 -keypass vivriti123 -dname "CN=Vivriti, OU=TaskManager, O=Vivriti, L=City, ST=State, C=IN"
}

$finalApk = Join-Path $PROJECT_ROOT "Task-and-Reminder-Manager.apk"
$rootFinalApk = "E:\Vivriti\Task-and-Reminder-Manager.apk"

& $APKSIGNER sign --ks $keystore --ks-pass pass:vivriti123 --out $finalApk $alignedApk
if ($LASTEXITCODE -ne 0) { throw "apksigner failed" }

Copy-Item -Path $finalApk -Destination $rootFinalApk -Force

Write-Host "`nVerifying signature..."
& $APKSIGNER verify --verbose $finalApk

$apkInfo = Get-Item $rootFinalApk
Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "SUCCESS! APK BUILT AND SIGNED:" -ForegroundColor Green
Write-Host "Location: $($apkInfo.FullName)" -ForegroundColor Yellow
Write-Host "Size: $([math]::Round($apkInfo.Length / 1KB, 2)) KB" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
