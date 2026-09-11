-- Representative seed: foods / exercises / yoga / plans
insert into public.foods (id,name,category,serving_size,calories,protein_g,carbs_g,fat_g,fiber_g,sugar_g) values
('idli','Idli (2 pc)','breakfast','2 pc (~120g)',140,5,28,1,2,0),
('dosa','Dosa (1)','breakfast','1 (~80g)',170,4,32,3,1,1),
('chapati','Chapati/Roti (1)','grains','1 (~40g)',110,3.5,22,1,3,0),
('rice','Cooked Rice','grains','1 cup (150g)',195,3.5,44,0.5,1,0),
('dal','Dal Tadka','dal','1 katori (150g)',170,8,20,6,5,2),
('paneer','Paneer (100g)','protein','100g',265,18,4,20,0,2),
('egg','Eggs (2)','protein','2 large',140,12,1,10,0,0),
('chicken','Chicken Curry (150g)','protein','150g',240,30,6,10,1,2),
('curd','Curd (1 katori)','dairy','150g',95,5,7,5,0,6),
('oats','Oats + Milk','breakfast','1 bowl',280,12,45,6,6,8)
on conflict (id) do nothing;

insert into public.exercises (id,name,muscle_group,level,equipment,environment,instructions_json) values
('push-up','Push-up','chest','normal','Bodyweight','both','["Hands under shoulders","Lower with control","Push up tall"]'),
('band-row','Band Row','back','easy','Resistance band','home','["Anchor at chest height","Pull elbows back","Return slowly"]'),
('db-press','Dumbbell Press','chest','normal','Dumbbells + bench','gym','["Feet planted","Lower to chest","Press up"]'),
('bodyweight-squat','Bodyweight Squat','legs','easy','Bodyweight','both','["Feet shoulder-width","Knees over toes","Chest tall"]'),
('dead-bug','Dead Bug','core','easy','Mat','both','["Back flat","Extend opposite limbs","Return without arching"]'),
('plank','Plank','core','easy','Mat','both','["Elbows under shoulders","Body straight","Breathe steadily"]'),
('walking','Brisk Walking','cardio','easy','None','both','["Tall posture","Brisk conversational pace","Cool down 5 min"]'),
('cat-cow','Cat-Cow','mobility','easy','Mat','both','["Tabletop","Arch then round slowly","Move with breath"]')
on conflict (id) do nothing;

insert into public.yoga_sessions (id,name,level,duration_min,focus,poses_json) values
('morning','Morning Mobility','easy',15,'Wake up joints','["breath","catcow","child","downdog-mod"]'),
('recovery','Post-workout Recovery','easy',20,'Hips + back','["child","catcow","bridge","breath"]'),
('sun','Sun Salutation Flow','normal',25,'Full body','["catcow","downdog-mod","warrior2","cobra"]')
on conflict (id) do nothing;

insert into public.workout_plans (id,name,level,goal,weeks,days_per_week,description) values
('full-a','Full Body A (Beginner)','easy','general_fitness',12,3,'Technique + routine, 20-40 min.'),
('upper-lower','Upper / Lower (Intermediate)','normal','muscle_gain',12,4,'Compound lifts + progressive overload.'),
('ppl','Push-Pull-Legs (Intermediate)','normal','muscle_gain',12,5,'Split routine.')
on conflict (id) do nothing;
