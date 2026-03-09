# Feature

Common Pagination Helper

# API

GET /<module>/list

query:

page
pageSize

response:

list
total
page
pageSize

# Permission

module.list

# Database

<module_table>

# Notes

Build a shared pagination method in `common` layer with high cohesion and low coupling.

Rules:

- `page` default: 1
- `pageSize` default: 10
- `pageSize` max: 100
- `total` is the total matched records count
- return shape is unified for all list APIs

