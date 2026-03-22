<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();       // admin, moderator, …
            $table->string('label');                // Display label
            $table->timestamps();
        });

        Schema::create('user_roles', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->primary(['user_id', 'role_id']);
            $table->timestamp('assigned_at')->useCurrent();
        });

        // Seed base roles
        DB::table('roles')->insert([
            ['name' => 'admin',     'label' => 'Administrator', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'moderator', 'label' => 'Moderator',     'created_at' => now(), 'updated_at' => now()],
        ]);

        // Migrate any existing is_admin=true users → admin role
        if (Schema::hasColumn('users', 'is_admin')) {
            $adminRoleId = DB::table('roles')->where('name', 'admin')->value('id');
            $adminUsers  = DB::table('users')->where('is_admin', true)->pluck('id');
            foreach ($adminUsers as $uid) {
                DB::table('user_roles')->insert(['user_id' => $uid, 'role_id' => $adminRoleId]);
            }
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_admin');
            });
        }
    }

    public function down(): void {
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('roles');
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false);
        });
    }
};
