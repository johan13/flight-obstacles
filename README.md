Flight obstacles
================
This repository holds the code for https://map.joleco.se.

Updating the list of obstacles
------------------------------
1. Find the URL to the current CSV file on lfv.se. The URL changes frequently. Right now it can be found at
   https://aro.lfv.se/Editorial/View/Dataset.
2. Update the URL in download.ts
3. Run `nvm use && npm install && npm run download`.

Deploying the app to AWS S3
---------------------------
Assuming AWS credentials are already configured in the joleco profile:
```
aws --profile=joleco s3 cp public s3://map.joleco.se/ --recursive
```
