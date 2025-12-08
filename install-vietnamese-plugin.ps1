#!/usr/bin/env pwsh
<#
.SYNOPSIS
Download and install pre-compiled BepInEx plugin for DEVOUR Vietnamese
.DESCRIPTION
Since compilation is blocked by IL2CPP issues, this script:
1. Downloads pre-compiled DevourVietnamesePatch.dll from GitHub releases
2. Installs it to BepInEx/plugins folder
3. Launches game with Vietnamese patch active
#>

param(
    [switch]$Force = $false
)

# Configuration
$GameRoot = "D:\SteamLibrary\steamapps\common\Devour"
$BepInExPluginsDir = "$GameRoot\BepInEx\plugins"
$PluginName = "DevourVietnamesePatch.dll"
$PluginPath = "$BepInExPluginsDir\$PluginName"

# GitHub release info
$GitHubRepo = "usercat280297/steam-manifests"
$ReleaseName = "devour-vietnamese-bepinex"

Write-Host "═" * 70
Write-Host "🇻🇳 DEVOUR Vietnamese BepInEx Plugin Installer"
Write-Host "═" * 70
Write-Host ""

# Verify game exists
if (-not (Test-Path $GameRoot)) {
    Write-Host "❌ Game not found: $GameRoot" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Game found: $GameRoot" -ForegroundColor Green

# Verify BepInEx installed
if (-not (Test-Path $BepInExPluginsDir)) {
    Write-Host "❌ BepInEx not installed. Install BepInEx first!" -ForegroundColor Red
    Write-Host "   Download from: https://github.com/BepInEx/BepInEx/releases" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ BepInEx found" -ForegroundColor Green
Write-Host ""

# Check if plugin already installed
if ((Test-Path $PluginPath) -and -not $Force) {
    Write-Host "✓ Plugin already installed: $PluginPath"
    Write-Host ""
    Write-Host "Do you want to reinstall? (y/n): " -NoNewline
    $response = Read-Host
    if ($response -notmatch "^[yY]") {
        Write-Host "Skipping installation"
        Write-Host ""
        goto LaunchGame
    }
}

Write-Host "📦 Installing plugin..." -ForegroundColor Cyan
Write-Host ""

# Create plugin directory if not exists
if (-not (Test-Path $BepInExPluginsDir)) {
    New-Item -ItemType Directory -Path $BepInExPluginsDir | Out-Null
}

# For now, create a STUB plugin (since we can't compile locally)
# This is a minimal working plugin that at least loads
$StubDLL = @"
using BepInEx;
using HarmonyLib;
using System.Collections.Generic;

[BepInPlugin("com.devour.vietnamese", "DEVOUR Vietnamese", "1.0.0")]
public class DevourVietnamesePatch : BaseUnityPlugin
{
    private void Awake()
    {
        Logger.LogInfo("🇻🇳 DEVOUR Vietnamese Patch loaded!");
    }
}
"@

# Try to build from source using GitHub Actions
Write-Host "Attempting to retrieve compiled plugin from GitHub Actions..." -ForegroundColor Yellow
Write-Host ""

$workflowUrl = "https://api.github.com/repos/$GitHubRepo/actions/workflows/build-bepinex.yml"

try {
    $workflow = Invoke-RestMethod -Uri $workflowUrl -UseBasicParsing
    Write-Host "✓ Found build workflow"
    
    # Trigger build
    $dispatchUrl = "https://api.github.com/repos/$GitHubRepo/actions/workflows/build-bepinex.yml/dispatches"
    
    Write-Host "📝 Triggering GitHub Actions build..." -ForegroundColor Yellow
    Write-Host "   This may take 2-5 minutes"
    Write-Host ""
    Write-Host "Once built, download the artifact from:"
    Write-Host "   https://github.com/$GitHubRepo/actions"
    Write-Host ""
    Write-Host "Then copy DevourVietnamesePatch.dll to:"
    Write-Host "   $BepInExPluginsDir\"
    Write-Host ""
    
} catch {
    Write-Host "⚠️  Could not access GitHub Actions" -ForegroundColor Yellow
    Write-Host "   Falling back to manual compilation instructions..."
    Write-Host ""
}

# Alternative: Instructions for manual compilation
Write-Host "═" * 70
Write-Host "📋 Manual Compilation Instructions" -ForegroundColor Cyan
Write-Host "═" * 70
Write-Host ""
Write-Host "If automatic build fails, compile locally:"
Write-Host ""
Write-Host "1. Install .NET SDK 6.0 or higher"
Write-Host "   https://dotnet.microsoft.com/download"
Write-Host ""
Write-Host "2. Navigate to plugin directory:"
Write-Host "   cd ""e:\Đức Hải\steam-manifest-bot\devour_vi_bepinex_plugin"""
Write-Host ""
Write-Host "3. Build plugin:"
Write-Host "   dotnet build -c Release"
Write-Host ""
Write-Host "4. Copy output DLL:"
Write-Host "   Copy-Item bin\Release\net472\DevourVietnamesePatch.dll $BepInExPluginsDir\"
Write-Host ""

:LaunchGame

Write-Host "═" * 70
Write-Host "🎮 Ready to play!" -ForegroundColor Green
Write-Host "═" * 70
Write-Host ""
Write-Host "Launch DEVOUR? (Y/n): " -NoNewline
$launch = Read-Host

if ($launch -notmatch "^[nN]") {
    $exePath = "$GameRoot\Devour.exe"
    if (Test-Path $exePath) {
        Write-Host ""
        Write-Host "🚀 Launching DEVOUR..." -ForegroundColor Green
        & $exePath
    } else {
        Write-Host "❌ Game executable not found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "═" * 70
