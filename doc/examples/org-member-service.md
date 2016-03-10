# Organizations and Members

- [Create an Organization](#create-an-organization)
- [Get all Organizations](#get-all-organizations)
- [Get an Organization](#get-an-organization)
- [Delete an Organization](#delete-an-organization)
- [Update an Organization](#update-an-organization)
- [Create an Member](#create-an-member)
- [List Members](#list-members)
- [Get a Member](#get-a-member)
- [Delete a Member](#delete-a-member)
- [Update a Member](#update-a-member)


## Create an Organization

Should be used to create a new Organization at Help.com

    POST /organization

#### Input

| Name | Type | Description |
| ---- | ---- | ----------- |
| `name` | `string` | **Required** The organization's name |
| `created_by` | `string` | The Member ID of the person that created this Organization |

**Note:** A user must be created first
#### Response

```headers
Status: 200 OK
```

```json
{
  "id": "8995E072-46B6-4264-A9BD-DAA955CBC360",
  "name": "Help.com",
  "created_at": "2016-02-23T22:29:13.454Z",
  "created_by": "16E2B3F8-8DE0-4DA0-A05F-FE59CEC57266",
  "modified_at": "2016-02-23T22:29:13.454Z",
  "modified_by": "4AEA9EDB-E043-42CE-B447-5AD77CC70314",
  "archived": false
}
```


***

## Get all Organizations

Returns an Array of Organizations

    GET /organization

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| `id` | `uuid (v4)` | The organization ID |
| `archived` | `boolean` | Are these organizations archived? |

#### Response

```headers
Status: 200 OK
```

```json
{
  "id": "8995E072-46B6-4264-A9BD-DAA955CBC360",
  "name": "Help.com",
  "created_at": "2016-02-23T22:29:13.454Z",
  "created_by": "16E2B3F8-8DE0-4DA0-A05F-FE59CEC57266",
  "modified_at": "2016-02-23T22:29:13.454Z",
  "modified_by": "4AEA9EDB-E043-42CE-B447-5AD77CC70314",
  "archived": false
}
```


**Note:** Will always return an Array

***

## Get an Organization

Returns a single Organization

    GET /organization/:id

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| `id` | `uuid (v4)` | The organization ID |
| `archived` | `boolean` | Are these organizations archived? |

#### Response

```headers
Status: 200 OK
```

```json
{
  "id": "8995E072-46B6-4264-A9BD-DAA955CBC360",
  "name": "Help.com",
  "created_at": "2016-02-23T22:29:13.454Z",
  "created_by": "16E2B3F8-8DE0-4DA0-A05F-FE59CEC57266",
  "modified_at": "2016-02-23T22:29:13.454Z",
  "modified_by": "4AEA9EDB-E043-42CE-B447-5AD77CC70314",
  "archived": false
}
```


**Note:** Will always return a single object or null

***

## Delete an Organization

Deletes the organization with the given _id_

    DELETE /organization/:id

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| `id` | `uuid (v4)` | **Required** The organization's ID |
| `archived_by` | `uuid (v4)` | **Required** The Member ID of the person who modified this record |

#### Response

```headers
Status: 200 OK
```

```json
{
  "id": "23EBEABD-CF0A-4FFF-BF7B-243F35D1CB2F",
  "result": "SUCCESS"
}
```


***

## Update an Organization

Will update the organization with the given _id_

    PATCH /organization/:id

#### Input

| Name | Type | Description |
| ---- | ---- | ----------- |
| `name` | `string` | **Required** The organization's new name |
| `modified_by` | `uuid (v4)` | **Required** The Member ID of the person who last modified this record |
| `modified_at` | `string` | **Required** The date this organization was last modified |

**Note:** Only the properties passed will be used to update
#### Response

```headers
Status: 200 OK
```

```json
{
  "id": "8995E072-46B6-4264-A9BD-DAA955CBC360",
  "name": "Help.com",
  "created_at": "2016-02-23T22:29:13.454Z",
  "created_by": "16E2B3F8-8DE0-4DA0-A05F-FE59CEC57266",
  "modified_at": "2016-02-23T22:29:13.454Z",
  "modified_by": "4AEA9EDB-E043-42CE-B447-5AD77CC70314",
  "archived": false
}
```


***

## Create an Member

Will create a new Member for the given _orgId_

    POST /organization/:orgId/member

#### Input

| Name | Type | Description |
| ---- | ---- | ----------- |
| `name` | `string` | **Required** The Member's Name |
| `email` | `string` | **Required** The Member's email address. Must be unique |
| `member_role` | `string` | **Required** The Member's role in the chat console |
| `display_name` | `string` | The name that will be publically displayed |
| `created_by` | `uuid (v4)` | **Required** The Member ID of the person that created this Member |

#### Response

```headers
Status: 200 OK
```

```json
{
  "id": "23EBEABD-CF0A-4FFF-BF7B-243F35D1CB2F",
  "email": "help@help.com",
  "name": "Jon Doe",
  "member_role": "admin",
  "organization_id": "D477D1F0-159A-442C-8A03-21451784DE12",
  "created_at": "2016-02-23T22:29:13.454Z",
  "created_by": "DF035275-88E6-495D-9650-CE8306FDB163",
  "modified_at": "2016-02-23T22:29:13.454Z",
  "modified_by": "DF035275-88E6-495D-9650-CE8306FDB163",
  "archived": false
}
```


***

## List Members

Gets all members for the organization with the given _orgId_

    GET /organization/:orgId/member

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| `organization_id` | `uuid (v4)` | The organization's ID |
| `id` | `uuid (v4)` | The member's ID |
| `archived` | `boolean` | Are these members archived? |

#### Response

```headers
Status: 200 OK
```

```json
{
  "id": "23EBEABD-CF0A-4FFF-BF7B-243F35D1CB2F",
  "email": "help@help.com",
  "name": "Jon Doe",
  "member_role": "admin",
  "organization_id": "D477D1F0-159A-442C-8A03-21451784DE12",
  "created_at": "2016-02-23T22:29:13.454Z",
  "created_by": "DF035275-88E6-495D-9650-CE8306FDB163",
  "modified_at": "2016-02-23T22:29:13.454Z",
  "modified_by": "DF035275-88E6-495D-9650-CE8306FDB163",
  "archived": false
}
```


***

## Get a Member

Gets a single member in organization _orgId_ with the given _id_

    GET /organization/:orgId/member/:id

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| `organization_id` | `uuid (v4)` | The organization's ID |
| `id` | `uuid (v4)` | The member's ID |
| `archived` | `boolean` | Are these members archived? |

#### Response

```headers
Status: 200 OK
```

```json
{
  "id": "23EBEABD-CF0A-4FFF-BF7B-243F35D1CB2F",
  "email": "help@help.com",
  "name": "Jon Doe",
  "member_role": "admin",
  "organization_id": "D477D1F0-159A-442C-8A03-21451784DE12",
  "created_at": "2016-02-23T22:29:13.454Z",
  "created_by": "DF035275-88E6-495D-9650-CE8306FDB163",
  "modified_at": "2016-02-23T22:29:13.454Z",
  "modified_by": "DF035275-88E6-495D-9650-CE8306FDB163",
  "archived": false
}
```


***

## Delete a Member

Deletes the member with _id_ in the organization _orgId_

    DELETE /organization/:orgId/member/:id

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| `id` | `uuid (v4)` | **Required** The member's ID |
| `archived_by` | `uuid (v4)` | **Required** The Member ID of the person who modified this record |

#### Response

```headers
Status: 200 OK
```

```json
{
  "id": "23EBEABD-CF0A-4FFF-BF7B-243F35D1CB2F",
  "result": "SUCCESS"
}
```


***

## Update a Member

Updates the member _id_ in the organization _orgId_

    PATCH /organization/:orgId/member/:id

#### Input

| Name | Type | Description |
| ---- | ---- | ----------- |
| `modified_by` | `string` | **Required** The Member ID of the person who last modified this record |
| `modified_at` | `string` | **Required** The date when this record was last modified |
| `name` | `string` | The new name |
| `email` | `string` | The Member's email address |
| `organization_id` | `uuid (v4)` | The organization ID of the Member |
| `display_name` | `string` | The public display name of the Member |

#### Response

```headers
Status: 200 OK
```

```json
{
  "id": "23EBEABD-CF0A-4FFF-BF7B-243F35D1CB2F",
  "email": "help@help.com",
  "name": "Jon Doe",
  "member_role": "admin",
  "organization_id": "D477D1F0-159A-442C-8A03-21451784DE12",
  "created_at": "2016-02-23T22:29:13.454Z",
  "created_by": "DF035275-88E6-495D-9650-CE8306FDB163",
  "modified_at": "2016-02-23T22:29:13.454Z",
  "modified_by": "DF035275-88E6-495D-9650-CE8306FDB163",
  "archived": false
}
```


***
