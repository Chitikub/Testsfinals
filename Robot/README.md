# Robot Framework profile tests

These tests mirror the profile behavior in the supplied React components. They
seed a test-only user session in the browser and mock both the current-user and
profile-update API requests, so no real account or credentials are needed and
profile changes are never sent to the real API.

## Install and run

From this directory, run the suite:

```powershell
py -m pip install -r requirements.txt
py -m robot --outputdir results tests
```

The default target is `https://moodlocation.vercel.app`. To test another
deployment, set `BASE_URL` before running Robot Framework, for example:

```powershell
$env:BASE_URL = "https://your-test-host.example"
py -m robot --outputdir results tests
```

The suite runs in headless Chrome. Selenium Manager may download a compatible
ChromeDriver on the first run. The image-size test follows the component's
10 MB limit.
