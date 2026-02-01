-- Initialize database with sample data
INSERT INTO books (title, author, publisher, created_at, updated_at)
VALUES
    ('Spring Boot in Action', 'Craig Walls', 'Manning', NOW(), NOW()),
    ('Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Prentice Hall', NOW(), NOW()),
    ('Effective Java', 'Joshua Bloch', 'Addison-Wesley', NOW(), NOW()),
    ('Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma', 'Addison-Wesley', NOW(), NOW()),
    ('GraphQL in Action', 'Sammy Dindyal', 'Manning', NOW(), NOW()),
    ('Building Microservices: Designing Fine-Grained Systems', 'Sam Newman', 'O''Reilly Media', NOW(), NOW()),
    ('Domain-Driven Design: Tackling Complexity in the Heart of Software', 'Eric Evans', 'Addison-Wesley', NOW(), NOW()),
    ('Refactoring: Improving the Design of Existing Code', 'Martin Fowler', 'Addison-Wesley', NOW(), NOW()),
    ('The Pragmatic Programmer: Your Journey to Mastery', 'David Thomas', 'Addison-Wesley', NOW(), NOW()),
    ('Head First Design Patterns', 'Eric Freeman', 'O''Reilly Media', NOW(), NOW())
    ON CONFLICT DO NOTHING;