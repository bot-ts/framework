---
description: Read this category if you have any issues with the framework or the CLI.
---

# Troubleshooting

## PSSecurityException

When using the CLI, your console displays an error of type **PSSecurityException**. \(picture attached\)

![](.gitbook/assets/troubleshooting.png)

### Fix PSSecurityException

Open your **PowerShell** **as administrator** and simply enter the following command.

```bash
set-executionpolicy remotesigned
```

