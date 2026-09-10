# Schemas

## User


| Column                  | type         | description          | mandatory |
| ----------------------- | ------------ | -------------------- | --------- |
| id                      | uuid         | unique user id       | Yes       |
| name                    | varchar(60)  | username             | No        |
| email                   | varchar(60)  | user email           | Yes       |
| is_active               | boolean      | false , true         | Yes       |
| email_verified               | boolean      | false , true         | Yes       |
| created_at | updated_at | timestamps   |                      | Yes       |


---



## Groups


| column                  | type         | description     | mandatory |
| ----------------------- | ------------ | --------------- | --------- |
| id                      | uuid         | unique group id | Yes       |
| name                    | varchar(255) | group name      | Yes       |
| created_at | updated_at | timestamps   |                 | Yes       |
| is_active               | boolean      | false , true    | Yes       |


---



## Group members


| column    | type       | description | mandatory |
| --------- | ---------- | ----------- | --------- |
| group_id  | FK(groups) |             | Yes       |
| member_id | FK(users)  |             | Yes       |
| role | enum  | owner, moderator, member             | Yes       |


---



## Projects


| column                  | type         | description                | mandatory |
| ----------------------- | ------------ | -------------------------- | --------- |
| id                      | uuid         | Id of the project          | Yes       |
| name                    | varchar(255) | Name of the project        | Yes       |
| is_active               | boolean      | false , true               | Yes       |
| created_at | updated_at | timestamps   |                            | Yes       |
| description             | text         | description of the project | No        |
| group_id                | FK(groups)   |                            | Yes       |


---



## Tasks


| column                  | type         | description                      | mandatory |
| ----------------------- | ------------ | -------------------------------- | --------- |
| id                      | uuid         | id of the task                   | Yes       |
| title                   | varchar(255) | task title                       | Yes       |
| description             | text         | task description                 | No        |
| project_id              | FK(projects) |                                  | Yes       |
| due_date                | date         | Optional due_date                | No        |
| priority                | enum         | High , Medium , Low , Critical   | Yes       |
| type                    | enum         | Mandatory , Optional , Desirable | Yes       |
| status  | enum | not_started , in progress , cancelled , done , stand_by                   |      Yes     |
| created_at | updated_at | timestamps   |                                  | Yes       |
| owner_id                | FK(users)    | Signed user of the task          | No       |
| created_by                | FK(users)    | User that created the task          | Yes       |


---



## Files


| column                  | type       | description       | mandatory |
| ----------------------- | ---------- | ----------------- | --------- |
| id                      | uuid       | File id           | Yes       |
| name                    | text       | filename          | Yes       |
| size                    | integer     | file size (in kb) | Yes       |
| asset_url               | text       | Cloudinary url    | Yes       |
| task_id                 | FK(tasks)  |                   | Yes       |
| created_at | updated_at | timestamps |                   |     Yes      |
| uploaded_by | FK(users) |                   |           |Yes


