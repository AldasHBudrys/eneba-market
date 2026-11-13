<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        // Tests wipe their database. Without .env.testing Laravel silently falls back to .env (the dev branch).
        $env = dirname(__DIR__).'/.env.testing';
        if (! file_exists($env) || ! preg_match('/^DB_URL=\S+/m', file_get_contents($env))) {
            $this->markTestSkipped('Put the Neon "test" branch URL in backend/.env.testing (DB_URL=...) to run database tests.');
        }

        parent::setUp();
    }
}
