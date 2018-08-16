# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     Sync.Repo.insert!(%Sync.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

Sync.Repo.delete_all(Sync.Coherence.User)
Sync.Repo.delete_all(Sync.Data.Module)
Sync.Repo.delete_all(Sync.Data.Semester)
Sync.Repo.delete_all(Sync.Data.AcadYear)
Sync.Repo.delete_all(Sync.Data.School)

Sync.Coherence.User.changeset(%Sync.Coherence.User{}, %{
  name: "Test User",
  email: "testuser@example.com",
  password: "secret",
  password_confirmation: "secret"
})
|> Sync.Repo.insert!()
|> Coherence.ControllerHelpers.confirm!()

defmodule SchoolSeeder do
  @num_fakes 5

  def gen_abbr(str) do
    str |> String.split() |> Stream.map(&String.first/1) |> Enum.join()
  end

  def new_module(_) do
    code = Faker.Util.format("%2A%4d%3A")

    %Sync.Data.Module{
      code: code,
      title: Faker.Company.catch_phrase(),
      description: Faker.Lorem.paragraph(),
      slug: code
    }
  end

  def new_sem(_) do
    %Sync.Data.Semester{
      name: Faker.Company.buzzword_suffix(),
      modules: 1..@num_fakes |> Enum.map(&new_module/1)
    }
  end

  def new_acad_year(_) do
    %Sync.Data.AcadYear{
      name: Faker.Company.buzzword_prefix(),
      semesters: 1..@num_fakes |> Enum.map(&new_sem/1)
    }
  end

  def insert_school(_) do
    uni_name = "#{Faker.Company.name()} University"
    short_name = gen_abbr(uni_name)

    %Sync.Data.School{
      short_name: short_name,
      long_name: uni_name,
      slug: String.downcase(short_name),
      acad_years: 1..@num_fakes |> Enum.map(&new_acad_year/1)
    }
    |> Sync.Repo.insert!()
  end
end

num_fakes = 5
1..num_fakes |> Enum.each(&SchoolSeeder.insert_school/1)
