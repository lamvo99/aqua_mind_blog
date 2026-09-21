$envFile = Get-Content ".env.local" | Where-Object { $_ -match "^(SANITY_API_TOKEN)=(.+)$" }
if (-not $envFile) { Write-Error "SANITY_API_TOKEN not found in .env.local"; exit 1 }
$token = ($envFile -split "=", 2)[1].Trim('"')

$baseUrl = "https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production"
$phaseDir = "F:\AquaMind\aqua_mind_blog\phase"
if (-not (Test-Path $phaseDir)) { New-Item -ItemType Directory -Path $phaseDir | Out-Null }

$entities = @{
    species = "name, scientificName, slug, waterType, difficulty, sizeCm, tankSizeMinL, diet, temperament, isPredator, reefCompatibility, aquariumStyle, region, group"
    plant = "name, slug, difficulty, light, co2, growth, placement, waterType"
    coral = "name, slug, coralType, waterType, light, flow, placement, difficulty, reefCompatibility"
    equipment = "name, slug, category, brand"
    invertebrate = "name, slug, waterType, difficulty, group, diet"
    problem = "name, slug, category, waterType"
    inspiration = "name, slug, style, difficulty"
}

$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
$total = 0
$errors = @()

foreach ($type in $entities.Keys) {
    $fields = $entities[$type]
    $query = "*[_type == `"$type`" && !(_id in path(`"drafts.**`"))] | order(name asc) { $fields }"
    $body = @{ query = $query } | ConvertTo-Json -Compress
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)

    try {
        $result = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $bodyBytes
        $data = $result.result
        $count = if ($data) { @($data).Count } else { 0 }
        $total += $count

        $outPath = Join-Path $phaseDir "baseline_${type}.json"
        $data | ConvertTo-Json -Depth 20 | Set-Content -Path $outPath -Encoding UTF8
        Write-Host "${type}: ${count} records -> $outPath"
    } catch {
        $errors += "${type}: $($_.Exception.Message)"
        Write-Error "${type}: $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "=== SUMMARY ==="
Write-Host "Total records: $total"
if ($errors.Count -gt 0) {
    Write-Host "Errors:"
    $errors | ForEach-Object { Write-Host "  - $_" }
} else {
    Write-Host "No errors."
}
