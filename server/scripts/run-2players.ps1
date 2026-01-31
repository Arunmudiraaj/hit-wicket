# Run 2 test players
# This script starts two test clients to simulate a full match

Write-Host "🏏 Starting 2 Test Players..." -ForegroundColor Cyan
Write-Host ""

# Start first player in background
$player1 = Start-Process -FilePath "node" -ArgumentList "scripts/test-client.js", "Player1" -PassThru -NoNewWindow
Write-Host "Started Player 1 (PID: $($player1.Id))" -ForegroundColor Green

# Small delay before second player
Start-Sleep -Milliseconds 500

# Start second player in background  
$player2 = Start-Process -FilePath "node" -ArgumentList "scripts/test-client.js", "Player2" -PassThru -NoNewWindow
Write-Host "Started Player 2 (PID: $($player2.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "Press Ctrl+C to stop both players" -ForegroundColor Yellow
Write-Host ""

# Wait for both to complete
try {
    Wait-Process -Id $player1.Id, $player2.Id
} catch {
    # Handle Ctrl+C
    Write-Host ""
    Write-Host "Stopping players..." -ForegroundColor Yellow
    Stop-Process -Id $player1.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $player2.Id -ErrorAction SilentlyContinue
}

Write-Host "Done!" -ForegroundColor Green
