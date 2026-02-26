import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive list of Nigerian universities, polytechnics, and colleges  
const NIGERIAN_SCHOOLS = [
    // Federal Universities
    { name: 'University of Lagos', type: 'Federal University', state: 'Lagos', city: 'Akoka' },
    { name: 'University of Ibadan', type: 'Federal University', state: 'Oyo', city: 'Ibadan' },
    { name: 'University of Nigeria, Nsukka', type: 'Federal University', state: 'Enugu', city: 'Nsukka' },
    { name: 'Obafemi Awolowo University', type: 'Federal University', state: 'Osun', city: 'Ile-Ife' },
    { name: 'Ahmadu Bello University', type: 'Federal University', state: 'Kaduna', city: 'Zaria' },
    { name: 'University of Benin', type: 'Federal University', state: 'Edo', city: 'Benin City' },
    { name: 'University of Ilorin', type: 'Federal University', state: 'Kwara', city: 'Ilorin' },
    { name: 'University of Jos', type: 'Federal University', state: 'Plateau', city: 'Jos' },
    { name: 'University of Calabar', type: 'Federal University', state: 'Cross River', city: 'Calabar' },
    { name: 'University of Port Harcourt', type: 'Federal University', state: 'Rivers', city: 'Port Harcourt' },
    { name: 'University of Maiduguri', type: 'Federal University', state: 'Borno', city: 'Maiduguri' },
    { name: 'Bayero University Kano', type: 'Federal University', state: 'Kano', city: 'Kano' },
    { name: 'University of Abuja', type: 'Federal University', state: 'FCT', city: 'Abuja' },
    { name: 'Nnamdi Azikiwe University', type: 'Federal University', state: 'Anambra', city: 'Awka' },
    { name: 'University of Uyo', type: 'Federal University', state: 'Akwa Ibom', city: 'Uyo' },
    { name: 'Federal University of Technology, Akure', type: 'Federal University', state: 'Ondo', city: 'Akure' },
    { name: 'Federal University of Technology, Minna', type: 'Federal University', state: 'Niger', city: 'Minna' },
    { name: 'Federal University of Technology, Owerri', type: 'Federal University', state: 'Imo', city: 'Owerri' },
    { name: 'Modibbo Adama University', type: 'Federal University', state: 'Adamawa', city: 'Yola' },
    { name: 'Usmanu Danfodiyo University', type: 'Federal University', state: 'Sokoto', city: 'Sokoto' },
    { name: 'Michael Okpara University of Agriculture', type: 'Federal University', state: 'Abia', city: 'Umudike' },
    { name: 'Federal University of Agriculture, Abeokuta', type: 'Federal University', state: 'Ogun', city: 'Abeokuta' },
    { name: 'Federal University Oye-Ekiti', type: 'Federal University', state: 'Ekiti', city: 'Oye-Ekiti' },
    { name: 'Federal University Dutsin-Ma', type: 'Federal University', state: 'Katsina', city: 'Dutsin-Ma' },
    { name: 'Federal University Kashere', type: 'Federal University', state: 'Gombe', city: 'Kashere' },
    { name: 'Federal University Lafia', type: 'Federal University', state: 'Nasarawa', city: 'Lafia' },
    { name: 'Federal University Lokoja', type: 'Federal University', state: 'Kogi', city: 'Lokoja' },
    { name: 'Federal University Ndufu-Alike', type: 'Federal University', state: 'Ebonyi', city: 'Ndufu-Alike' },
    { name: 'Federal University Otuoke', type: 'Federal University', state: 'Bayelsa', city: 'Otuoke' },
    { name: 'Federal University Wukari', type: 'Federal University', state: 'Taraba', city: 'Wukari' },
    { name: 'Federal University Birnin Kebbi', type: 'Federal University', state: 'Kebbi', city: 'Birnin Kebbi' },
    { name: 'Federal University Gusau', type: 'Federal University', state: 'Zamfara', city: 'Gusau' },
    { name: 'Federal University Gashua', type: 'Federal University', state: 'Yobe', city: 'Gashua' },
    { name: 'Nigerian Defence Academy', type: 'Federal University', state: 'Kaduna', city: 'Kaduna' },
    { name: 'Nigerian Police Academy', type: 'Federal University', state: 'Kano', city: 'Wudil' },

    // State Universities
    { name: 'Lagos State University', type: 'State University', state: 'Lagos', city: 'Ojo' },
    { name: 'Ladoke Akintola University of Technology', type: 'State University', state: 'Oyo', city: 'Ogbomoso' },
    { name: 'Olabisi Onabanjo University', type: 'State University', state: 'Ogun', city: 'Ago-Iwoye' },
    { name: 'Enugu State University of Science and Technology', type: 'State University', state: 'Enugu', city: 'Enugu' },
    { name: 'Rivers State University', type: 'State University', state: 'Rivers', city: 'Port Harcourt' },
    { name: 'Delta State University', type: 'State University', state: 'Delta', city: 'Abraka' },
    { name: 'Ambrose Alli University', type: 'State University', state: 'Edo', city: 'Ekpoma' },
    { name: 'Adekunle Ajasin University', type: 'State University', state: 'Ondo', city: 'Akungba-Akoko' },
    { name: 'Ekiti State University', type: 'State University', state: 'Ekiti', city: 'Ado-Ekiti' },
    { name: 'Osun State University', type: 'State University', state: 'Osun', city: 'Osogbo' },
    { name: 'Kwara State University', type: 'State University', state: 'Kwara', city: 'Malete' },
    { name: 'Nasarawa State University', type: 'State University', state: 'Nasarawa', city: 'Keffi' },
    { name: 'Benue State University', type: 'State University', state: 'Benue', city: 'Makurdi' },
    { name: 'Kogi State University', type: 'State University', state: 'Kogi', city: 'Anyigba' },
    { name: 'Kaduna State University', type: 'State University', state: 'Kaduna', city: 'Kaduna' },
    { name: 'Niger Delta University', type: 'State University', state: 'Bayelsa', city: 'Wilberforce Island' },
    { name: 'Cross River University of Technology', type: 'State University', state: 'Cross River', city: 'Calabar' },
    { name: 'Abia State University', type: 'State University', state: 'Abia', city: 'Uturu' },
    { name: 'Imo State University', type: 'State University', state: 'Imo', city: 'Owerri' },
    { name: 'Anambra State University of Science and Technology', type: 'State University', state: 'Anambra', city: 'Uli' },
    { name: 'Ebonyi State University', type: 'State University', state: 'Ebonyi', city: 'Abakaliki' },
    { name: 'Kano University of Science and Technology', type: 'State University', state: 'Kano', city: 'Wudil' },
    { name: 'Kebbi State University of Science and Technology', type: 'State University', state: 'Kebbi', city: 'Aliero' },
    { name: 'Sokoto State University', type: 'State University', state: 'Sokoto', city: 'Sokoto' },
    { name: 'Gombe State University', type: 'State University', state: 'Gombe', city: 'Gombe' },
    { name: 'Taraba State University', type: 'State University', state: 'Taraba', city: 'Jalingo' },
    { name: 'Adamawa State University', type: 'State University', state: 'Adamawa', city: 'Mubi' },
    { name: 'Yobe State University', type: 'State University', state: 'Yobe', city: 'Damaturu' },
    { name: 'Bauchi State University', type: 'State University', state: 'Bauchi', city: 'Gadau' },
    { name: 'Zamfara State University', type: 'State University', state: 'Zamfara', city: 'Talata Mafara' },
    { name: 'Plateau State University', type: 'State University', state: 'Plateau', city: 'Bokkos' },

    // Private Universities
    { name: 'Covenant University', type: 'Private University', state: 'Ogun', city: 'Ota' },
    { name: 'Babcock University', type: 'Private University', state: 'Ogun', city: 'Ilishan-Remo' },
    { name: 'Bowen University', type: 'Private University', state: 'Osun', city: 'Iwo' },
    { name: 'Pan-Atlantic University', type: 'Private University', state: 'Lagos', city: 'Ibeju-Lekki' },
    { name: 'Afe Babalola University', type: 'Private University', state: 'Ekiti', city: 'Ado-Ekiti' },
    { name: 'Bells University of Technology', type: 'Private University', state: 'Ogun', city: 'Ota' },
    { name: 'Caleb University', type: 'Private University', state: 'Lagos', city: 'Imota' },
    { name: 'Crawford University', type: 'Private University', state: 'Ogun', city: 'Igbesa' },
    { name: 'Redeemer\'s University', type: 'Private University', state: 'Osun', city: 'Ede' },
    { name: 'Landmark University', type: 'Private University', state: 'Kwara', city: 'Omu-Aran' },
    { name: 'Lead City University', type: 'Private University', state: 'Oyo', city: 'Ibadan' },
    { name: 'Achievers University', type: 'Private University', state: 'Ondo', city: 'Owo' },
    { name: 'Joseph Ayo Babalola University', type: 'Private University', state: 'Osun', city: 'Ikeji-Arakeji' },
    { name: 'Ajayi Crowther University', type: 'Private University', state: 'Oyo', city: 'Oyo' },
    { name: 'American University of Nigeria', type: 'Private University', state: 'Adamawa', city: 'Yola' },
    { name: 'Bingham University', type: 'Private University', state: 'Nasarawa', city: 'Karu' },
    { name: 'Igbinedion University', type: 'Private University', state: 'Edo', city: 'Okada' },
    { name: 'Madonna University', type: 'Private University', state: 'Anambra', city: 'Okija' },
    { name: 'Elizade University', type: 'Private University', state: 'Ondo', city: 'Ilara-Mokin' },
    { name: 'Oduduwa University', type: 'Private University', state: 'Osun', city: 'Ipetumodu' },
    { name: 'Veritas University', type: 'Private University', state: 'FCT', city: 'Abuja' },
    { name: 'African University of Science and Technology', type: 'Private University', state: 'FCT', city: 'Abuja' },
    { name: 'Nile University of Nigeria', type: 'Private University', state: 'FCT', city: 'Abuja' },
    { name: 'BAZE University', type: 'Private University', state: 'FCT', city: 'Abuja' },

    // Polytechnics
    { name: 'Yaba College of Technology', type: 'Polytechnic', state: 'Lagos', city: 'Yaba' },
    { name: 'Lagos State Polytechnic', type: 'Polytechnic', state: 'Lagos', city: 'Ikorodu' },
    { name: 'Federal Polytechnic Ilaro', type: 'Polytechnic', state: 'Ogun', city: 'Ilaro' },
    { name: 'The Polytechnic Ibadan', type: 'Polytechnic', state: 'Oyo', city: 'Ibadan' },
    { name: 'Auchi Polytechnic', type: 'Polytechnic', state: 'Edo', city: 'Auchi' },
    { name: 'Federal Polytechnic Nekede', type: 'Polytechnic', state: 'Imo', city: 'Owerri' },
    { name: 'Kaduna Polytechnic', type: 'Polytechnic', state: 'Kaduna', city: 'Kaduna' },
    { name: 'Federal Polytechnic Bida', type: 'Polytechnic', state: 'Niger', city: 'Bida' },
    { name: 'Institute of Management and Technology', type: 'Polytechnic', state: 'Enugu', city: 'Enugu' },
    { name: 'Kwara State Polytechnic', type: 'Polytechnic', state: 'Kwara', city: 'Ilorin' },
    { name: 'Rufus Giwa Polytechnic', type: 'Polytechnic', state: 'Ondo', city: 'Owo' },
    { name: 'Federal Polytechnic Offa', type: 'Polytechnic', state: 'Kwara', city: 'Offa' },
    { name: 'Federal Polytechnic Ado-Ekiti', type: 'Polytechnic', state: 'Ekiti', city: 'Ado-Ekiti' },
    { name: 'Akwa Ibom State Polytechnic', type: 'Polytechnic', state: 'Akwa Ibom', city: 'Ikot Osurua' },
    { name: 'Federal Polytechnic Bauchi', type: 'Polytechnic', state: 'Bauchi', city: 'Bauchi' },

    // Colleges of Education
    { name: 'Federal College of Education, Abeokuta', type: 'College of Education', state: 'Ogun', city: 'Abeokuta' },
    { name: 'Federal College of Education, Akoka', type: 'College of Education', state: 'Lagos', city: 'Akoka' },
    { name: 'Adeniran Ogunsanya College of Education', type: 'College of Education', state: 'Lagos', city: 'Otto/Ijanikin' },
    { name: 'Federal College of Education, Zaria', type: 'College of Education', state: 'Kaduna', city: 'Zaria' },
    { name: 'National Teachers Institute', type: 'College of Education', state: 'Kaduna', city: 'Kaduna' },
];

async function seedSchools() {
    console.log(`🎓 Seeding ${NIGERIAN_SCHOOLS.length} Nigerian schools...`);

    let created = 0;
    let skipped = 0;

    for (const school of NIGERIAN_SCHOOLS) {
        try {
            await prisma.school.upsert({
                where: { name: school.name },
                update: {
                    type: school.type,
                    state: school.state,
                    city: school.city,
                },
                create: {
                    name: school.name,
                    type: school.type,
                    state: school.state,
                    city: school.city,
                    isApproved: true,
                },
            });
            created++;
        } catch (error) {
            skipped++;
            console.log(`  ⚠ Skipped: ${school.name}`);
        }
    }

    console.log(`\n✅ Done! ${created} schools seeded, ${skipped} skipped.`);
}

seedSchools()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
