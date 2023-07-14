import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/__version__ (GET)', () => {
    return request(app.getHttpServer())
      .get('/__lbheartbeat__')
      .expect(200)
      .expect('{}');
  });

  it('/graphql (GET)', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: 'query GetUid {\n  account {\n    uid\n  }\n}\n',
      })
      .expect(200);
  });

  it('/graphql (GET) - with invalid query', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: 'query GetUid { }',
      })
      .expect(403);
  });
});
