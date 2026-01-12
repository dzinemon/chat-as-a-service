import { useState, useEffect } from 'react';
import axios from 'axios';
import DeleteModal from '../components/DeleteModal';

import { useAuth } from '../contexts/useAuth';

interface Bot {
  id: string;
  name: string;
  instructions?: string;
}

const Dashboard = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmbed, setShowEmbed] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    botId: null as null | string,
    botName: '',
  });

  const { user, logout } = useAuth();

  const fetchBots = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/bots`);
      setBots(res.data);
    } catch (error) {
      console.error('Error fetching bots:', error);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const createBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !instructions) return;

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/bots`, {
        name,
        instructions,
        allowed_domains: ['*'],
      });
      setName('');
      setInstructions('');
      fetchBots();
    } catch (error) {
      console.error('Error creating bot:', error);
      alert('Failed to create bot');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (bot: Bot) => {
    setDeleteModal({ isOpen: true, botId: bot.id, botName: bot.name });
  };

  const handleDelete = async () => {
    if (!deleteModal.botId) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/bots/${deleteModal.botId}`
      );
      setDeleteModal({ isOpen: false, botId: null, botName: '' });
      fetchBots();
    } catch (error) {
      console.error('Error deleting bot:', error);
    }
  };

  const getEmbedCode = (botId: string) => {
    return `<script src="${import.meta.env.VITE_API_URL}/widget.js" data-bot-id="${botId}"></script>`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Chatbot Dashboard
            </h1>
            <p className="text-slate-600">Welcome, {user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-slate-500 hover:text-slate-800 underline"
          >
            Logout
          </button>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">
              Create New Bot
            </h2>
            <form onSubmit={createBot} className="space-y-4">
              <div>
                <label htmlFor="bot-name" className="block text-sm font-medium text-slate-700 mb-1">
                  Bot Name
                </label>
                <input
                  id="bot-name"
                  type="text"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="e.g. Support Agent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="bot-instructions" className="block text-sm font-medium text-slate-700 mb-1">
                  Instructions (Personality)
                </label>
                <textarea
                  id="bot-instructions"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition h-32 resize-none"
                  placeholder="You are a helpful assistant..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Bot'}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Your Bots</h2>
            {bots.length === 0 && (
              <p className="text-slate-500 italic">No bots created yet.</p>
            )}
            {bots.map((bot) => (
              <div
                key={bot.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {bot.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => confirmDelete(bot)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                  {bot.instructions}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setShowEmbed(showEmbed === bot.id ? null : bot.id)
                    }
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >
                    {showEmbed === bot.id ? 'Hide Code' : 'Get Embed Code'}
                  </button>
                  <a
                    href={`/widget/${bot.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 text-sm font-medium hover:underline"
                  >
                    Test Widget
                  </a>
                </div>

                {showEmbed === bot.id && (
                  <div className="mt-3 bg-slate-900 rounded-lg p-3 relative group">
                    <code className="text-xs text-green-400 break-all block font-mono">
                      {getEmbedCode(bot.id)}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(getEmbedCode(bot.id))
                      }
                      className="absolute top-2 right-2 text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition opacity-0 group-hover:opacity-100"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDelete}
        botName={deleteModal.botName}
      />
    </div>
  );
};

export default Dashboard;
