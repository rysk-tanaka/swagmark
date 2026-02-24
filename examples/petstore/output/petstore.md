<!-- markdownlint-disable MD024 MD028 MD033 MD036 -->

# Swagger Petstore v1.0.0

Base URLs:

* <a href="http://petstore.swagger.io/v1">http://petstore.swagger.io/v1</a>

 License: MIT

## pets

<details>
<summary>

![🔵 GET](https://badgers.space/badge/_/GET/blue?label=&corner_radius=5) **`/pets`** — List all pets

</summary>

```shell
curl -X GET http://petstore.swagger.io/v1/pets \
  -H 'Accept: application/json'

```

### Parameters

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|integer(int32)|false|How many items to return at one time (max 100)|

> Example responses

> 200 Response

```json
[
  {
    "id": 0,
    "name": "string",
    "tag": "string"
  }
]
```

### Responses

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|OK|A paged array of pets|[Pets](#schemapets)|
|default|Default|unexpected error|[Error](#schemaerror)|

### Response Headers

|Status|Header|Type|Format|Description|
|---|---|---|---|---|
|200|x-next|string||A link to the next page of responses|

</details>

<details>
<summary>

![🟢 POST](https://badgers.space/badge/_/POST/green?label=&corner_radius=5) **`/pets`** — Create a pet

</summary>

```shell
curl -X POST http://petstore.swagger.io/v1/pets \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"id":0,"name":"string","tag":"string"}'

```

> Body parameter

```json
{
  "id": 0,
  "name": "string",
  "tag": "string"
}
```

### Parameters

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[Pet](#schemapet)|true|none|
|» id|body|integer(int64)|true|none|
|» name|body|string|true|none|
|» tag|body|string|false|none|

> Example responses

> default Response

```json
{
  "code": 0,
  "message": "string"
}
```

### Responses

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|Created|Null response|None|
|default|Default|unexpected error|[Error](#schemaerror)|

</details>

<details>
<summary>

![🔵 GET](https://badgers.space/badge/_/GET/blue?label=&corner_radius=5) **`/pets/{petId}`** — Info for a specific pet

</summary>

```shell
curl -X GET http://petstore.swagger.io/v1/pets/{petId} \
  -H 'Accept: application/json'

```

### Parameters

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|petId|path|string|true|The id of the pet to retrieve|

> Example responses

> 200 Response

```json
{
  "id": 0,
  "name": "string",
  "tag": "string"
}
```

### Responses

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|OK|Expected response to a valid request|[Pet](#schemapet)|
|default|Default|unexpected error|[Error](#schemaerror)|

</details>

## Schemas

<a id="schemapet"></a>
<details>
<summary>

<strong>Pet</strong>

</summary>

```json
{
  "id": 0,
  "name": "string",
  "tag": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|integer(int64)|true|none|none|
|name|string|true|none|none|
|tag|string|false|none|none|

</details>

<a id="schemapets"></a>
<details>
<summary>

<strong>Pets</strong>

</summary>

```json
[
  {
    "id": 0,
    "name": "string",
    "tag": "string"
  }
]

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[Pet](#schemapet)]|false|none|none|

</details>

<a id="schemaerror"></a>
<details>
<summary>

<strong>Error</strong>

</summary>

```json
{
  "code": 0,
  "message": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|code|integer(int32)|true|none|none|
|message|string|true|none|none|

</details>
