const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Book = require('./models/Book');

// Connect to environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const classicBooks = [
    // === YOUR ORIGINAL 10 MASTERWORKS ===
    {
        title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "978-0060935467", shelfLocation: "A1-Classic",
        publicationYear: 1960, genre: "Classic", totalCopies: 5, availableCopies: 5, isActive: true,
        description: "Compassionate, dramatic, and deeply moving, To Kill A Mockingbird takes readers to the roots of human behavior.",
        coverImageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "The Metamorphosis", author: "Franz Kafka", isbn: "978-0553213690", shelfLocation: "B3-Fiction",
        publicationYear: 1915, genre: "Philosophy", totalCopies: 3, availableCopies: 3, isActive: true,
        description: "A terrifying psychological romp into the mind of Gregor Samsa, who wakes up transformed into a giant insect.",
        coverImageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "1984", author: "George Orwell", isbn: "978-0451524935", shelfLocation: "C2-SciFi",
        publicationYear: 1949, genre: "Science", totalCopies: 8, availableCopies: 8, isActive: true,
        description: "Among the seminal texts of the 20th century, a rare work that grows more haunting as its futuristic purgatory becomes more real.",
        coverImageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Pride and Prejudice", author: "Jane Austen", isbn: "978-0141439518", shelfLocation: "A2-Classic",
        publicationYear: 1813, genre: "Romance", totalCopies: 4, availableCopies: 4, isActive: true,
        description: "Since its immediate success in 1813, Pride and Prejudice has remained one of the most popular novels in the English language.",
        coverImageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565", shelfLocation: "A3-Classic",
        publicationYear: 1925, genre: "Fiction", totalCopies: 6, availableCopies: 6, isActive: true,
        description: "The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.",
        coverImageUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Moby-Dick", author: "Herman Melville", isbn: "978-0142437247", shelfLocation: "D1-Classic",
        publicationYear: 1851, genre: "Classic", totalCopies: 2, availableCopies: 2, isActive: true,
        description: "First published in 1851, Melville's masterpiece is the greatest novel in American literature.",
        coverImageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "The Catcher in the Rye", author: "J.D. Salinger", isbn: "978-0316769174", shelfLocation: "B1-Fiction",
        publicationYear: 1951, genre: "Fiction", totalCopies: 7, availableCopies: 7, isActive: true,
        description: "The hero-narrator is an ancient child of sixteen, a native New Yorker named Holden Caulfield.",
        coverImageUrl: "https://images.unsplash.com/photo-1474366521946-c3d4b507abf2?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "978-0547928227", shelfLocation: "E1-Fantasy",
        publicationYear: 1937, genre: "Fantasy", totalCopies: 10, availableCopies: 10, isActive: true,
        description: "A great modern classic and the prelude to The Lord of the Rings.",
        coverImageUrl: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Fahrenheit 451", author: "Ray Bradbury", isbn: "978-1451673319", shelfLocation: "C3-SciFi",
        publicationYear: 1953, genre: "Science", totalCopies: 4, availableCopies: 4, isActive: true,
        description: "Guy Montag is a fireman. His job is to destroy the most illegal of commodities, the printed book.",
        coverImageUrl: "https://images.unsplash.com/photo-1485286162995-aa63d31c06cb?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Brave New World", author: "Aldous Huxley", isbn: "978-0060850524", shelfLocation: "C4-SciFi",
        publicationYear: 1932, genre: "Science", totalCopies: 5, availableCopies: 5, isActive: true,
        description: "A profoundly important classic of world literature, a searching vision of an unequal, technologically-advanced future.",
        coverImageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop"
    },

    // === YOUR CUSTOM REQUESTS ===
    {
        title: "The Help", author: "Kathryn Stockett", isbn: "978-0425232200", shelfLocation: "F1-Drama",
        publicationYear: 2009, genre: "Drama", totalCopies: 6, availableCopies: 6, isActive: true,
        description: "A deeply moving novel about three ordinary women who are about to take one extraordinary step.",
        coverImageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "The Count of Monte Cristo", author: "Alexandre Dumas", isbn: "978-0140449266", shelfLocation: "A4-Classic",
        publicationYear: 1844, genre: "Classic", totalCopies: 4, availableCopies: 4, isActive: true,
        description: "Thrown in prison for a crime he has not committed, Edmond Dantès unearths a vast treasure to exact revenge.",
        coverImageUrl: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Woman at Point Zero", author: "Nawal El Saadawi", isbn: "978-1783605941", shelfLocation: "P1-Philosophy",
        publicationYear: 1975, genre: "Philosophy", totalCopies: 3, availableCopies: 3, isActive: true,
        description: "The story of Firdaus, an Egyptian peasant girl whose entire life is a rebellion against the structures of society.",
        coverImageUrl: "https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Oliver Twist", author: "Charles Dickens", isbn: "978-0141439747", shelfLocation: "A5-Classic",
        publicationYear: 1838, genre: "Classic", totalCopies: 7, availableCopies: 7, isActive: true,
        description: "The story of the orphan Oliver, who runs away from the workhouse only to be taken in by a den of thieves.",
        coverImageUrl: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Sense and Sensibility", author: "Jane Austen", isbn: "978-0141439662", shelfLocation: "R1-Romance",
        publicationYear: 1811, genre: "Romance", totalCopies: 5, availableCopies: 5, isActive: true,
        description: "Two sisters of opposing temperaments who share the pangs of tragic love.",
        coverImageUrl: "https://images.unsplash.com/photo-1490578474895-699bc4e3f44f?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Ugly Love", author: "Colleen Hoover", isbn: "978-1476753188", shelfLocation: "R2-Romance",
        publicationYear: 2014, genre: "Romance", totalCopies: 12, availableCopies: 12, isActive: true,
        description: "When Tate Collins meets airline pilot Miles Archer, she doesn't think it's love at first sight.",
        coverImageUrl: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=600&auto=format&fit=crop"
    },

    // === NEW EXPANDED CLASSICS ===
    {
        title: "Jane Eyre", author: "Charlotte Brontë", isbn: "978-0141441146", shelfLocation: "A6-Classic",
        publicationYear: 1847, genre: "Classic", totalCopies: 4, availableCopies: 4, isActive: true,
        description: "The classic tale of a young orphan who survives hardships to become a governess and falls in love with her brooding employer.",
        coverImageUrl: "https://images.unsplash.com/photo-1455885661740-10906b3a2072?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Wuthering Heights", author: "Emily Brontë", isbn: "978-0141439556", shelfLocation: "R3-Romance",
        publicationYear: 1847, genre: "Romance", totalCopies: 3, availableCopies: 3, isActive: true,
        description: "A wild, passionate story of the intense and almost demonic love between Catherine Earnshaw and Heathcliff.",
        coverImageUrl: "https://images.unsplash.com/photo-1518609384587-f269a941620a?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Frankenstein", author: "Mary Shelley", isbn: "978-0141439471", shelfLocation: "C5-SciFi",
        publicationYear: 1818, genre: "Science", totalCopies: 6, availableCopies: 6, isActive: true,
        description: "A young scientist creates a sapient creature in an unorthodox scientific experiment.",
        coverImageUrl: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Dracula", author: "Bram Stoker", isbn: "978-0141439846", shelfLocation: "M1-Mystery",
        publicationYear: 1897, genre: "Mystery", totalCopies: 5, availableCopies: 5, isActive: true,
        description: "The legendary gothic horror novel that introduced Count Dracula and established many conventions of vampire fantasy.",
        coverImageUrl: "https://images.unsplash.com/photo-1509594119335-51ea18a99477?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "The Picture of Dorian Gray", author: "Oscar Wilde", isbn: "978-0141439570", shelfLocation: "P2-Philosophy",
        publicationYear: 1890, genre: "Philosophy", totalCopies: 4, availableCopies: 4, isActive: true,
        description: "A man sells his soul for eternal youth and beauty, while his portrait ages and records every sin.",
        coverImageUrl: "https://images.unsplash.com/photo-1578301978018-3005759f48f7?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Crime and Punishment", author: "Fyodor Dostoevsky", isbn: "978-0140449136", shelfLocation: "P3-Philosophy",
        publicationYear: 1866, genre: "Philosophy", totalCopies: 3, availableCopies: 3, isActive: true,
        description: "The mental anguish and moral dilemmas of Rodion Raskolnikov, an impoverished ex-student who formulates a plan to kill an unscrupulous pawnbroker.",
        coverImageUrl: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Anna Karenina", author: "Leo Tolstoy", isbn: "978-0143035008", shelfLocation: "A7-Classic",
        publicationYear: 1878, genre: "Classic", totalCopies: 5, availableCopies: 5, isActive: true,
        description: "A complex novel in eight parts, widely considered to be one of the greatest works of literature ever written.",
        coverImageUrl: "https://images.unsplash.com/photo-1490578474895-699bc4e3f44f?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Les Misérables", author: "Victor Hugo", isbn: "978-0451419439", shelfLocation: "A8-Classic",
        publicationYear: 1862, genre: "Classic", totalCopies: 7, availableCopies: 7, isActive: true,
        description: "An epic historical novel following the lives and interactions of several characters, focusing on the struggles of ex-convict Jean Valjean.",
        coverImageUrl: "https://images.unsplash.com/photo-1533669955142-6a73332af4db?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "A Tale of Two Cities", author: "Charles Dickens", isbn: "978-0141439600", shelfLocation: "H1-History",
        publicationYear: 1859, genre: "History", totalCopies: 4, availableCopies: 4, isActive: true,
        description: "Set in London and Paris before and during the French Revolution. 'It was the best of times, it was the worst of times...'",
        coverImageUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Great Expectations", author: "Charles Dickens", isbn: "978-0141439563", shelfLocation: "A9-Classic",
        publicationYear: 1861, genre: "Classic", totalCopies: 6, availableCopies: 6, isActive: true,
        description: "The coming-of-age story of an orphan named Pip, full of extreme imagery—poverty, prison ships and chains, and fights to the death.",
        coverImageUrl: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Don Quixote", author: "Miguel de Cervantes", isbn: "978-0060934347", shelfLocation: "A10-Classic",
        publicationYear: 1605, genre: "Classic", totalCopies: 3, availableCopies: 3, isActive: true,
        description: "Follows the adventures of a noble from La Mancha who reads so many chivalric romances that he loses his mind and decides to become a knight-errant.",
        coverImageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "The Odyssey", author: "Homer", isbn: "978-0140268867", shelfLocation: "H2-History",
        publicationYear: -800, genre: "History", totalCopies: 8, availableCopies: 8, isActive: true,
        description: "One of two major ancient Greek epic poems attributed to Homer. It follows the Greek hero Odysseus, king of Ithaca, and his journey home after the Trojan War.",
        coverImageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Catch-22", author: "Joseph Heller", isbn: "978-0684833392", shelfLocation: "F2-Fiction",
        publicationYear: 1961, genre: "Fiction", totalCopies: 5, availableCopies: 5, isActive: true,
        description: "Set during World War II, this satirical novel follows Captain John Yossarian and his attempts to maintain his sanity while fulfilling his service requirements.",
        coverImageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Lord of the Flies", author: "William Golding", isbn: "978-0399501487", shelfLocation: "F3-Fiction",
        publicationYear: 1954, genre: "Fiction", totalCopies: 9, availableCopies: 9, isActive: true,
        description: "A group of British boys stranded on an uninhabited island and their disastrous attempt to govern themselves.",
        coverImageUrl: "https://images.unsplash.com/photo-1511108690759-009324a5033d?q=80&w=600&auto=format&fit=crop"
    }
];

const seedBooks = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to the Vault.');

        // Delete existing books to avoid duplication of the same titles
        await Book.deleteMany({});
        console.log('🧹 Cleared old inventory data.');

        await Book.insertMany(classicBooks);
        console.log(`📚 Successfully injected ${classicBooks.length} Masterworks into the Archive!`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Book Seeder Error:', error);
        process.exit(1);
    }
};

seedBooks();