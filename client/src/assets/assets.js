// import dummy_profile from './dummy_profile.png'
export const DummyResumeData = {
    _id: '64b6f4e2f1d2c3a4b5c6d7e8',
    userId: '64b6f4a1e2d3c4b5a6d7e8f9',
    title: 'Software Developer Resume',
    personal_info: {
        full_name: 'Sumit Raj Verma',
        email: 'sumitraj1228@gmail.com',
        phone: '+91 9876543210',
        address: '123, ABC Street, City, Country',
        linkedin: 'linkedin.com/in/sumitrajverma',
        github: 'github.com/sumitrajverma',
        website: 'www.sumitrajverma.com',
        profession: 'Software Developer',
        // image: dummy_profile
    },
    professional_summary: 'A highly motivated and results-oriented Software Developer with 2+ years of experience in building and maintaining web applications. Proficient in JavaScript, React, and Node.js. Seeking to leverage my technical skills and passion for creating innovative solutions in a challenging role.',
    experience: [
        {
            _id: 'exp1',
            company: 'Tech Solutions Inc.',
            location: 'Bengaluru, India',
            position: 'Software Engineer',
            start_date: '2023-01',
            end_date: '',
            is_current: true,
            description: 'Developed and maintained front-end features for a large-scale e-commerce platform using React and Redux. Collaborated with cross-functional teams to deliver high-quality software products.'
        },
        {
            _id: 'exp2',
            company: 'Web Wizards LLC',
            location: 'Mumbai, India',
            position: 'Junior Web Developer',
            start_date: '2022-06',
            end_date: '2022-12',
            is_current: false,
            description: 'Assisted in the development of responsive websites for various clients. Gained hands-on experience with HTML, CSS, and JavaScript.'
        }
    ],
    education: [
        {
            _id: 'edu1',
            institution: 'Indian Institute of Technology, Delhi',
            degree: 'Bachelor of Technology',
            field: 'Computer Science',
            graduation_date: '2022-05',
            gpa: '8.5 CGPA'
        }
    ],
    skills: [
        'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'Express', 'Django', 'MongoDB', 'PostgreSQL', 'MySQL', 'Git', 'Docker', 'AWS', 'REST APIs'
    ],
    project: [
        {
            _id: 'proj1',
            name: 'E-commerce Website',
            description: 'A full-stack e-commerce website built with the MERN stack. Features include user authentication, product catalog, shopping cart, and payment integration.',
            link: 'github.com/sumitrajverma/ecommerce-project'
        }
    ]
}