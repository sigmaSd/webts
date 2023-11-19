# Web TS

Simple program to create a web app with typescript

## Install

```
deno install -n webts -A https://raw.githubusercontent.com/sigmaSd/webts/0.1.0/main.ts
```

## Usage

- scaffold the project

```
webts init myproject
```

- run the project

```
cd myproject && webts
firefox http://localhost:8000
```

Now you can make changes to anyfile inside the project and it will automaticlly
bundle the code and reload the page.

Optional: The code is assumed to use deno lsp. (the scaffold comes with an already configured deno.json file)

[Screencast from 2023-11-19 19-57-54.webm](https://github.com/sigmaSd/webts/assets/22427111/e87930bf-cfa3-4580-b189-cdb083256007)
